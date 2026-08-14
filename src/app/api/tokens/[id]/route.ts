import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const { id } = await params;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const token = await db.token.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    await db.token.delete({ where: { id } });

    await logAuditEvent(
      'Token Deleted',
      `Token ${token.tokenString} assigned to Student ${token.student?.fullName || token.studentId} was deleted.`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete token error:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
