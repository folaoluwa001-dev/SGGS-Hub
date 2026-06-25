import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

// 1. GET: List all subjects
export async function GET(request: Request) {
  try {
    // Authenticate (Admin & Teacher can view subjects)
    await requireAuth(['SUPER_ADMIN', 'TEACHER']);

    const subjects = await db.subject.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(subjects);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. POST: Create a subject
export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const { name, description } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    if (!name) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    // Check duplicate
    const existing = await db.subject.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json({ error: `Subject '${name}' already exists.` }, { status: 400 });
    }

    const subject = await db.subject.create({
      data: {
        name,
        description: description || '',
      },
    });

    await logAuditEvent(
      'Subject Created',
      `Subject '${name}' was created.`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json(subject, { status: 201 });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
