import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

const TERM_ORDER: Record<string, number> = {
  'First Term': 1,
  'Second Term': 2,
  'Third Term': 3,
};

// GET: Fetch all terms sorted logically
export async function GET() {
  try {
    await requireAuth();

    const terms = await db.term.findMany();

    // Sort in First Term -> Second Term -> Third Term order
    terms.sort((a, b) => (TERM_ORDER[a.name] || 99) - (TERM_ORDER[b.name] || 99));

    return NextResponse.json(terms);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// POST: Activate a term or update resumption dates
export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const body = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // 1. Update Resumption Dates
    if (body.action === 'set_resumption' || body.resumptionDates) {
      const dates = body.resumptionDates || {};
      const updatedTerms = [];

      for (const [termIdOrName, dateVal] of Object.entries(dates)) {
        const parsedDate = dateVal ? new Date(dateVal as string) : null;
        
        // Find term by ID or name
        const term = await db.term.findFirst({
          where: {
            OR: [
              { id: termIdOrName },
              { name: termIdOrName },
            ],
          },
        });

        if (term) {
          const updated = await db.term.update({
            where: { id: term.id },
            data: { resumptionDate: parsedDate },
          });
          updatedTerms.push(updated);

          // Also persist in Settings table for redundancy/quick lookup
          await db.settings.upsert({
            where: { key: `resumption_date_${term.name.toLowerCase().replace(/\s+/g, '_')}` },
            update: { value: dateVal ? (dateVal as string) : '' },
            create: { key: `resumption_date_${term.name.toLowerCase().replace(/\s+/g, '_')}`, value: dateVal ? (dateVal as string) : '' },
          });
        }
      }

      await logAuditEvent(
        'Term Resumption Updated',
        `Admin updated term resumption dates for ${updatedTerms.length} terms`,
        sessionUser.userId,
        ip,
        userAgent
      );

      const allTerms = await db.term.findMany();
      allTerms.sort((a, b) => (TERM_ORDER[a.name] || 99) - (TERM_ORDER[b.name] || 99));
      return NextResponse.json({ success: true, terms: allTerms });
    }

    // 2. Single term resumption date update
    if (body.termId && body.resumptionDate !== undefined) {
      const parsedDate = body.resumptionDate ? new Date(body.resumptionDate) : null;
      const term = await db.term.update({
        where: { id: body.termId },
        data: { resumptionDate: parsedDate },
      });

      await logAuditEvent(
        'Term Resumption Updated',
        `Admin set resumption date for '${term.name}' to ${body.resumptionDate || 'none'}`,
        sessionUser.userId,
        ip,
        userAgent
      );

      return NextResponse.json(term);
    }

    // 3. Activate term
    const { name, id, active } = body;
    let targetTerm = null;

    if (id) {
      targetTerm = await db.term.findUnique({ where: { id } });
    } else if (name) {
      targetTerm = await db.term.findUnique({ where: { name } });
    }

    if (!targetTerm) {
      return NextResponse.json({ error: 'Term not found' }, { status: 400 });
    }

    if (active) {
      // Deactivate all other terms
      await db.term.updateMany({
        data: { active: false },
      });

      // Activate target term
      targetTerm = await db.term.update({
        where: { id: targetTerm.id },
        data: { active: true },
      });

      // Update active term settings key
      await db.settings.upsert({
        where: { key: 'current_term_id' },
        update: { value: targetTerm.id },
        create: { key: 'current_term_id', value: targetTerm.id },
      });
    }

    await logAuditEvent(
      'Term Configured',
      `Academic Term set to active: '${targetTerm.name}'`,
      sessionUser.userId,
      ip,
      userAgent
    );

    const allTerms = await db.term.findMany();
    allTerms.sort((a, b) => (TERM_ORDER[a.name] || 99) - (TERM_ORDER[b.name] || 99));
    return NextResponse.json({ success: true, activeTerm: targetTerm, terms: allTerms });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
