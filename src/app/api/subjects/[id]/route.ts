import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

// 1. PUT: Edit a subject
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const { id } = await params;
    const { name, description } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const existing = await db.subject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    if (name && name !== existing.name) {
      const dupe = await db.subject.findUnique({ where: { name } });
      if (dupe) {
        return NextResponse.json({ error: `Subject '${name}' already exists.` }, { status: 400 });
      }
    }

    const updated = await db.subject.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
      },
    });

    await logAuditEvent(
      'Subject Updated',
      `Subject '${existing.name}' was renamed to '${updated.name}'.`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. DELETE: Delete a subject
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const { id } = await params;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const subject = await db.subject.findUnique({ where: { id } });
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Delete subject (will cascade delete results referencing it)
    await db.subject.delete({ where: { id } });

    await logAuditEvent(
      'Subject Deleted',
      `Subject '${subject.name}' was deleted.`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
