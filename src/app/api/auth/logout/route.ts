import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, logAuditEvent } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    if (session) {
      await logAuditEvent('Logout', `User ${session.username} logged out.`, session.userId, ip, userAgent);
    }

    const cookieStore = await cookies();
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
