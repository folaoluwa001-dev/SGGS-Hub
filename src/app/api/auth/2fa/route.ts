import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';
import { generate2FASecret, verify2FACode } from '@/lib/twoFactor';
import { schoolConfig } from '../../../../../config/school.config';

// 1. GET: Start 2FA configuration (Generate secret and QR code)
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    
    // Generate TOTP secret
    const setup = await generate2FASecret(session.username, schoolConfig.schoolName);
    
    // Save secret temporarily (disabled status)
    await db.user.update({
      where: { id: session.userId },
      data: {
        twoFactorSecret: setup.secret,
        twoFactorEnabled: false, // Ensure not enabled until verified
      }
    });

    return NextResponse.json({
      secret: setup.secret,
      qrCodeUrl: setup.qrCodeUrl,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. POST: Complete 2FA configuration (Verify code and enable)
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { code } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    if (!code) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId }
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: '2FA has not been initialized for this account' }, { status: 400 });
    }

    const isValid = verify2FACode(code, user.twoFactorSecret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Enable 2FA
    await db.user.update({
      where: { id: session.userId },
      data: { twoFactorEnabled: true }
    });

    await logAuditEvent('2FA Enabled', `2FA activated for user ${session.username}`, session.userId, ip, userAgent);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 3. DELETE: Disable 2FA
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await db.user.update({
      where: { id: session.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    });

    await logAuditEvent('2FA Disabled', `2FA deactivated for user ${session.username}`, session.userId, ip, userAgent);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
