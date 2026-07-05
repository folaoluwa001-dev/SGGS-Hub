import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateTemplateCSV, syncScoresFromGoogleSheet } from '@/services/sheets';

// 1. GET: Download CSV template for a class
export async function GET(request: Request) {
  try {
    // Requires Teacher or Admin auth
    await requireAuth(['SUPER_ADMIN', 'TEACHER']);

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 });
    }

    const csvContent = await generateTemplateCSV(classId);

    // Dynamic file renaming based on selected class and subject
    const cls = await db.class.findUnique({ where: { id: classId } });
    const subj = subjectId ? await db.subject.findUnique({ where: { id: subjectId } }) : null;

    const className = cls ? cls.name : 'Class';
    const subjectName = subj ? subj.name : '';

    const safeClassName = className.replace(/[^a-zA-Z0-9]/g, '_');
    const safeSubjectName = subjectName ? subjectName.replace(/[^a-zA-Z0-9]/g, '_') : 'grading';
    const filename = `${safeSubjectName}_${safeClassName}_template.csv`;

    // Return as downloadable file response
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. POST: Sync scores from a Google Sheet url
export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN', 'TEACHER']);
    const body = await request.json();

    const { spreadsheetUrl, classId, subjectId, termId, sessionId } = body;

    if (!spreadsheetUrl || !classId || !subjectId || !termId || !sessionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const syncResult = await syncScoresFromGoogleSheet(
      spreadsheetUrl,
      classId,
      subjectId,
      termId,
      sessionId,
      sessionUser.userId
    );

    return NextResponse.json(syncResult);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
