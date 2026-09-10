import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

// 1. GET: Fetch attendance records for a class, session, and term
export async function GET(request: Request) {
  try {
    await requireAuth(['SUPER_ADMIN', 'TEACHER', 'BURSAR']);

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const termId = searchParams.get('termId');
    const sessionId = searchParams.get('sessionId');
    const studentId = searchParams.get('studentId');

    const whereClause: any = {};
    if (studentId) whereClause.studentId = studentId;
    if (classId) whereClause.classId = classId;
    if (termId) whereClause.termId = termId;
    if (sessionId) whereClause.sessionId = sessionId;

    const attendances = await db.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            fullName: true,
            gender: true,
          },
        },
      },
      orderBy: {
        student: {
          fullName: 'asc',
        },
      },
    });

    return NextResponse.json(attendances);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. POST: Batch record or update attendance records
export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN', 'TEACHER']);
    const body = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Body can be a single record or an array of records
    const rawRecords = Array.isArray(body.records) ? body.records : [body];

    if (rawRecords.length === 0) {
      return NextResponse.json({ error: 'No attendance records provided' }, { status: 400 });
    }

    const savedRecords = [];

    for (const item of rawRecords) {
      const { studentId, classId, sessionId, termId, daysPresent, totalDays, remark } = item;

      if (!studentId || !classId || !sessionId || !termId) {
        continue;
      }

      const parsedTotalDays = Math.max(0, parseInt(String(totalDays), 10) || 0);
      const parsedDaysPresent = Math.max(0, parseInt(String(daysPresent), 10) || 0);

      // Avoid division by zero
      const percentage = parsedTotalDays > 0
        ? Math.min(100, Math.max(0, Math.round((parsedDaysPresent / parsedTotalDays) * 1000) / 10))
        : 0;

      const record = await db.attendance.upsert({
        where: {
          studentId_termId_sessionId: {
            studentId,
            termId,
            sessionId,
          },
        },
        update: {
          classId,
          daysPresent: parsedDaysPresent,
          totalDays: parsedTotalDays,
          percentage,
          remark: remark || null,
        },
        create: {
          studentId,
          classId,
          sessionId,
          termId,
          daysPresent: parsedDaysPresent,
          totalDays: parsedTotalDays,
          percentage,
          remark: remark || null,
        },
      });

      savedRecords.push(record);
    }

    await logAuditEvent(
      'Attendance Recorded',
      `Saved attendance for ${savedRecords.length} student(s) by ${sessionUser.username}`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: `Successfully saved attendance for ${savedRecords.length} student(s).`,
      count: savedRecords.length,
      records: savedRecords,
    });
  } catch (error: any) {
    console.error('Attendance save error:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
