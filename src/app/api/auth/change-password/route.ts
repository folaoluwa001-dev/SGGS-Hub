import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getSession, logAuditEvent } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // 1. Retrieve the current authenticated session
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session access' }, { status: 401 });
    }

    // 2. Validate roles allowed (SUPER_ADMIN, TEACHER, BURSAR)
    const allowedRoles = ['SUPER_ADMIN', 'TEACHER', 'BURSAR'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    // 3. Parse request payload
    const { currentPassword, newPassword, confirmNewPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json({ error: 'All password fields are required' }, { status: 400 });
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json({ error: 'New password and password confirmation do not match' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    // 4. Fetch the user details from DB
    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 5. Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // 6. Hash new password and save it
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // 7. Write an audit log entry (omit actual password content)
    await logAuditEvent(
      'Change Password',
      `User ${user.username} changed their account password successfully.`,
      user.id,
      ip,
      userAgent
    );

    // 8. Invalidate active cookies to force log out
    const cookieStore = await cookies();
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Change Password API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
