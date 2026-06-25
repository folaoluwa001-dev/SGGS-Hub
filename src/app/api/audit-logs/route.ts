import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Requires Admin privilege to read audit logs
    await requireAuth(['SUPER_ADMIN']);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { details: { contains: search } },
        { ipAddress: { contains: search } },
        { user: { fullName: { contains: search } } },
        { user: { username: { contains: search } } },
      ];
    }

    if (action) {
      whereClause.action = action;
    }

    const logs = await db.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            username: true,
            fullName: true,
            role: { select: { name: true } }
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
