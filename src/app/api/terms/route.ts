import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

// GET: Fetch all terms
export async function GET() {
  try {
    await requireAuth();

    const terms = await db.term.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(terms);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// POST: Activate a term
export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const { name, active } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    if (!name) {
      return NextResponse.json({ error: 'Term name (e.g. First Term) is required' }, { status: 400 });
    }

    let term = await db.term.findUnique({ where: { name } });

    if (!term) {
      return NextResponse.json({ error: 'Invalid term specified' }, { status: 400 });
    }

    if (active) {
      // Deactivate all terms
      await db.term.updateMany({
        data: { active: false },
      });

      // Activate target term
      term = await db.term.update({
        where: { id: term.id },
        data: { active: true },
      });

      // Update active term settings key
      await db.settings.upsert({
        where: { key: 'current_term_id' },
        update: { value: term.id },
        create: { key: 'current_term_id', value: term.id },
      });
    }

    await logAuditEvent(
      'Term Configured',
      `Academic Term set to active: '${name}'`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json(term);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
