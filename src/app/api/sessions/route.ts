import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

// GET: Fetch all sessions
export async function GET() {
  try {
    await requireAuth();

    const sessions = await db.session.findMany({
      orderBy: { name: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// POST: Create or activate a session
export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const { name, active } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    if (!name) {
      return NextResponse.json({ error: 'Session name (e.g., 2025/2026) is required' }, { status: 400 });
    }

    // Check duplicate
    let session = await db.session.findUnique({ where: { name } });

    if (session) {
      if (active) {
        // Deactivate other sessions
        await db.session.updateMany({
          data: { active: false },
        });

        session = await db.session.update({
          where: { id: session.id },
          data: { active: true },
        });

        // Update active session settings key
        await db.settings.upsert({
          where: { key: 'current_session_id' },
          update: { value: session.id },
          create: { key: 'current_session_id', value: session.id },
        });
      }
    } else {
      if (active) {
        // Deactivate other sessions
        await db.session.updateMany({
          data: { active: false },
        });
      }

      session = await db.session.create({
        data: { name, active: !!active },
      });

      if (active) {
        await db.settings.upsert({
          where: { key: 'current_session_id' },
          update: { value: session.id },
          create: { key: 'current_session_id', value: session.id },
        });
      }
    }

    await logAuditEvent(
      'Session Configured',
      `Session '${name}' created/updated. Active: ${active}`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json(session);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
