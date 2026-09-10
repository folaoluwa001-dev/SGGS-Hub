import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

// 1. GET: Fetch all classes
export async function GET() {
  try {
    // Authenticated users can list classes
    await requireAuth();

    const classes = await db.class.findMany();

    const CLASS_ORDER: Record<string, number> = {
      JSS1: 1,
      JSS2: 2,
      JSS3: 3,
      SSS1: 4,
      SSS2: 5,
      SSS3: 6,
    };

    classes.sort((a, b) => {
      const orderA = CLASS_ORDER[a.name] || (a.level === 'GRADUATED' ? 100 : 50);
      const orderB = CLASS_ORDER[b.name] || (b.level === 'GRADUATED' ? 100 : 50);
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(classes);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. POST: Create a new class
export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const { name, level } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    if (!name || !level) {
      return NextResponse.json({ error: 'Class name and level (JUNIOR/SENIOR) are required' }, { status: 400 });
    }

    // Check duplicate
    const existing = await db.class.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: `Class '${name}' already exists.` }, { status: 400 });
    }

    const cls = await db.class.create({
      data: { name, level },
    });

    await logAuditEvent(
      'Class Created',
      `Class '${name}' was created by Admin.`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json(cls, { status: 201 });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
