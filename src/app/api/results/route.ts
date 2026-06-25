import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

// 1. GET: Fetch results list
export async function GET(request: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || '';
    const classId = searchParams.get('classId') || '';
    const subjectId = searchParams.get('subjectId') || '';
    const termId = searchParams.get('termId') || '';
    const sessionId = searchParams.get('sessionId') || '';

    const where: any = {};

    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;
    if (termId) where.termId = termId;
    if (sessionId) where.sessionId = sessionId;
    if (classId) {
      where.student = { classId };
    }

    const results = await db.result.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
          },
        },
        subject: true,
        term: true,
        session: true,
      },
      orderBy: [
        { student: { fullName: 'asc' } },
        { subject: { name: 'asc' } },
      ],
    });

    return NextResponse.json(results);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. POST: Create or Update a result score manually
export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN', 'TEACHER']);
    const body = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const { studentId, subjectId, termId, sessionId, caScore, examScore } = body;

    if (!studentId || !subjectId || !termId || !sessionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const ca = parseFloat(caScore);
    const exam = parseFloat(examScore);

    if (isNaN(ca) || isNaN(exam)) {
      return NextResponse.json({ error: 'Scores must be numeric values' }, { status: 400 });
    }

    if (ca < 0 || ca > 30) {
      return NextResponse.json({ error: 'CA score must be between 0 and 30' }, { status: 400 });
    }

    if (exam < 0 || exam > 70) {
      return NextResponse.json({ error: 'Exam score must be between 0 and 70' }, { status: 400 });
    }

    const total = ca + exam;
    
    // Grading system
    let grade = 'F';
    let remark = 'Fail';

    if (total >= 70) {
      grade = 'A';
      remark = 'Excellent';
    } else if (total >= 60) {
      grade = 'B';
      remark = 'Very Good';
    } else if (total >= 50) {
      grade = 'C';
      remark = 'Good';
    } else if (total >= 45) {
      grade = 'D';
      remark = 'Fair';
    } else if (total >= 40) {
      grade = 'E';
      remark = 'Pass';
    }

    // Upsert Result
    const result = await db.result.upsert({
      where: {
        studentId_subjectId_termId_sessionId: {
          studentId,
          subjectId,
          termId,
          sessionId,
        },
      },
      update: {
        caScore: ca,
        examScore: exam,
        totalScore: total,
        grade,
        remark,
      },
      create: {
        studentId,
        subjectId,
        termId,
        sessionId,
        caScore: ca,
        examScore: exam,
        totalScore: total,
        grade,
        remark,
      },
      include: {
        student: true,
        subject: true,
      },
    });

    await logAuditEvent(
      'Score Manual Entry',
      `Score updated for Student ${result.student.fullName} in Subject ${result.subject.name}: CA=${ca}, Exam=${exam}, Total=${total}`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
