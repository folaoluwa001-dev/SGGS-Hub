import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { verify2FACode } from '@/lib/twoFactor';
import { logAuditEvent } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password, twoFactorCode } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { username },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Two-factor authentication check
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return NextResponse.json({ twoFactorRequired: true }, { status: 200 });
      }

      if (!user.twoFactorSecret) {
        return NextResponse.json({ error: '2FA secret not configured' }, { status: 500 });
      }

      const isValid2FA = verify2FACode(twoFactorCode, user.twoFactorSecret);
      if (!isValid2FA) {
        return NextResponse.json({ error: 'Invalid two-factor code' }, { status: 401 });
      }
    }

    // Sign tokens
    const permissions = JSON.parse(user.role.permissions);
    const accessToken = signAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role.name,
      permissions,
    });
    const refreshToken = signRefreshToken(user.id);

    // Save tokens in cookies
    const cookieStore = await cookies();
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 mins
    });

    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Write audit log
    await logAuditEvent('Login', `User ${username} logged in successfully.`, user.id, ip, userAgent);

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        fullName: user.fullName,
        role: user.role.name,
        permissions,
      },
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
