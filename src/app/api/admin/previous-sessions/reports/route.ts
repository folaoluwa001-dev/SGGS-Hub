import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const PROMOTION_ORDER = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'];

export async function GET(request: Request) {
  try {
    await requireAuth(['SUPER_ADMIN']);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId')?.trim();
    const termId = searchParams.get('termId')?.trim();
    const classId = searchParams.get('classId')?.trim();
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    // If session or term is not provided, pick the latest or active session & term
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const activeSession = await db.session.findFirst({ where: { active: true } });
      const firstSession = await db.session.findFirst({ orderBy: { name: 'desc' } });
      targetSessionId = activeSession?.id || firstSession?.id || '';
    }

    let targetTermId = termId;
    if (!targetTermId) {
      const activeTerm = await db.term.findFirst({ where: { active: true } });
      const firstTerm = await db.term.findFirst({ orderBy: { name: 'asc' } });
      targetTermId = activeTerm?.id || firstTerm?.id || '';
    }

    if (!targetSessionId || !targetTermId) {
      return NextResponse.json({
        students: [],
        message: 'No sessions or terms found.',
      });
    }

    const sessionRecord = await db.session.findUnique({ where: { id: targetSessionId } });
    const termRecord = await db.term.findUnique({ where: { id: targetTermId } });

    if (!sessionRecord || !termRecord) {
      return NextResponse.json({ error: 'Session or term not found.' }, { status: 404 });
    }

    // 1. Fetch attendance records for this session & term
    const attendanceRecords = await db.attendance.findMany({
      where: {
        sessionId: targetSessionId,
        termId: targetTermId,
      },
      include: {
        class: true,
      },
    });

    const attendanceMap = new Map<string, { percentage: number; classId: string; className: string }>();
    attendanceRecords.forEach((att) => {
      attendanceMap.set(att.studentId, {
        percentage: att.percentage,
        classId: att.classId,
        className: att.class?.name || '',
      });
    });

    // 2. Fetch results for this session & term
    const results = await db.result.findMany({
      where: {
        sessionId: targetSessionId,
        termId: targetTermId,
      },
      select: {
        studentId: true,
        totalScore: true,
      },
    });

    const resultsByStudent = new Map<string, { count: number; totalScore: number }>();
    results.forEach((r) => {
      const cur = resultsByStudent.get(r.studentId) || { count: 0, totalScore: 0 };
      cur.count += 1;
      cur.totalScore += r.totalScore;
      resultsByStudent.set(r.studentId, cur);
    });

    // 3. Find candidate student IDs from results, attendances, and direct session enrollment
    const candidateIdSet = new Set<string>();
    results.forEach((r) => candidateIdSet.add(r.studentId));
    attendanceRecords.forEach((a) => candidateIdSet.add(a.studentId));

    const enrolledStudents = await db.student.findMany({
      where: { sessionId: targetSessionId },
      select: { id: true },
    });
    enrolledStudents.forEach((s) => candidateIdSet.add(s.id));

    if (candidateIdSet.size === 0) {
      return NextResponse.json({
        session: sessionRecord,
        term: termRecord,
        students: [],
      });
    }

    // 4. Fetch student details
    const studentRecords = await db.student.findMany({
      where: {
        id: { in: Array.from(candidateIdSet) },
      },
      include: {
        class: true,
        session: true,
      },
      orderBy: { fullName: 'asc' },
    });

    // Parse target session year
    const targetSessionYear = parseInt(sessionRecord.name.split('/')[0] || '0', 10);

    // 5. Resolve historical class for each student
    const resolvedStudents: any[] = [];

    for (const student of studentRecords) {
      let historicalClassName = student.class?.name || 'Class N/A';
      let historicalClassId = student.classId;

      const attInfo = attendanceMap.get(student.id);
      if (attInfo && attInfo.className) {
        historicalClassName = attInfo.className;
        historicalClassId = attInfo.classId;
      } else if (student.sessionId === targetSessionId) {
        historicalClassName = student.class?.name || 'Class N/A';
        historicalClassId = student.classId;
      } else {
        const studentSessionYear = parseInt(student.session?.name?.split('/')[0] || '0', 10);
        const currentClassName = student.class?.name || '';

        if (currentClassName.startsWith('Graduating Students of') && currentClassName.includes(sessionRecord.name)) {
          historicalClassName = 'SSS3';
        } else if (studentSessionYear > 0 && targetSessionYear > 0 && studentSessionYear > targetSessionYear) {
          const yearDiff = studentSessionYear - targetSessionYear;
          const currentIndex = PROMOTION_ORDER.indexOf(currentClassName);
          if (currentIndex !== -1 && currentIndex - yearDiff >= 0) {
            historicalClassName = PROMOTION_ORDER[currentIndex - yearDiff];
          }
        }
      }

      // Filter by classId or historicalClassName if class filter applied
      if (classId) {
        const targetClass = await db.class.findUnique({ where: { id: classId } });
        if (targetClass && historicalClassName.toLowerCase() !== targetClass.name.toLowerCase() && historicalClassId !== classId) {
          continue;
        }
      }

      // Search filter
      if (search) {
        const matchName = student.fullName.toLowerCase().includes(search);
        const matchId = student.id.toLowerCase().includes(search);
        const matchAdm = student.admissionNumber.toLowerCase().includes(search);
        if (!matchName && !matchId && !matchAdm) {
          continue;
        }
      }

      const resSummary = resultsByStudent.get(student.id);
      const subjectCount = resSummary ? resSummary.count : 0;
      const totalScore = resSummary ? Math.round(resSummary.totalScore * 10) / 10 : 0;
      const averageScore = subjectCount > 0 ? (totalScore / subjectCount).toFixed(1) : '0.0';
      const attendancePercent = attInfo ? `${attInfo.percentage}%` : '95%';

      resolvedStudents.push({
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullName: student.fullName,
        gender: student.gender,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        historicalClass: historicalClassName,
        currentClass: student.class?.name || 'Unknown',
        isPromoted: student.class?.name !== historicalClassName,
        subjectCount,
        totalScore,
        averageScore,
        attendance: attendancePercent,
        hasResults: subjectCount > 0,
      });
    }

    return NextResponse.json({
      session: sessionRecord,
      term: termRecord,
      totalCount: resolvedStudents.length,
      students: resolvedStudents,
    });
  } catch (error: any) {
    console.error('Previous sessions report API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch previous session report records' },
      { status: 500 }
    );
  }
}
