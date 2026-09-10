import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { studentId: rawStudentId, tokenString: rawTokenString, visitorName: rawVisitorName, termId, sessionId } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const studentId = typeof rawStudentId === 'string' ? rawStudentId.trim() : '';
    const tokenString = typeof rawTokenString === 'string' ? rawTokenString.trim().toUpperCase() : '';
    const visitorName = typeof rawVisitorName === 'string' ? rawVisitorName.trim() : '';

    if (!studentId || !tokenString || !visitorName) {
      return NextResponse.json({ error: 'Student ID, Token, and Visitor Name are required' }, { status: 400 });
    }

    // 1. Verify Student ID (case-insensitive search by student ID or admission number)
    const student = await db.student.findFirst({
      where: {
        OR: [
          { id: { equals: studentId, mode: 'insensitive' } },
          { admissionNumber: { equals: studentId, mode: 'insensitive' } },
        ],
      },
      include: {
        class: true,
        session: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Invalid Student ID. Student record not found.' }, { status: 404 });
    }

    // 2. Verify Token (case-insensitive)
    const token = await db.token.findFirst({
      where: {
        tokenString: { equals: tokenString, mode: 'insensitive' },
      },
    });

    if (!token) {
      return NextResponse.json({ error: 'Invalid Token code. Double check the spelling.' }, { status: 401 });
    }

    // 3. Verify Token Ownership (compare against resolved student.id)
    if (token.studentId !== student.id) {
      return NextResponse.json({ error: 'This token is not registered for this student ID.' }, { status: 401 });
    }

    // 4. Verify Token Status & Expiration
    if (token.status === 'Disabled') {
      return NextResponse.json({ error: 'This token has been disabled by the administrator.' }, { status: 401 });
    }

    const now = new Date();
    if (token.expiresAt < now || token.status === 'Expired') {
      // Mark as expired in db if it was active
      if (token.status === 'Active') {
        await db.token.update({
          where: { id: token.id },
          data: { status: 'Expired' }
        });
      }
      return NextResponse.json({ error: 'This token has expired.' }, { status: 401 });
    }

    if (token.usageCount >= token.maxUsage || token.status === 'Consumed') {
      return NextResponse.json({ error: 'This token has exceeded its maximum usage limit (3 checks).' }, { status: 401 });
    }

    // 5. Determine active session and term if not specified
    let targetSessionId = sessionId;
    let targetTermId = termId;

    if (!targetSessionId) {
      const activeSession = await db.session.findFirst({ where: { active: true } });
      targetSessionId = activeSession?.id || student.sessionId;
    }

    if (!targetTermId) {
      const activeTerm = await db.term.findFirst({ where: { active: true } });
      targetTermId = activeTerm?.id;
    }

    // Fallback to any term that has results for this student if target has none
    if (!targetTermId || !targetSessionId) {
      const firstResult = await db.result.findFirst({
        where: { studentId: student.id },
        select: { termId: true, sessionId: true },
        orderBy: { createdAt: 'desc' }
      });
      if (firstResult) {
        if (!targetTermId) targetTermId = firstResult.termId;
        if (!targetSessionId) targetSessionId = firstResult.sessionId;
      }
    }

    // If still no term, find first term in DB
    if (!targetTermId) {
      const firstTerm = await db.term.findFirst();
      targetTermId = firstTerm?.id;
    }
    if (!targetSessionId) {
      const firstSession = await db.session.findFirst();
      targetSessionId = firstSession?.id || student.sessionId;
    }

    // 6. Fetch results for the target session/term
    const results = await db.result.findMany({
      where: {
        studentId: student.id,
        termId: targetTermId,
        sessionId: targetSessionId,
      },
      include: {
        subject: true,
        term: true,
        session: true,
      },
      orderBy: {
        subject: { name: 'asc' },
      },
    });

    const activeTermRecord = targetTermId ? await db.term.findUnique({ where: { id: targetTermId } }) : await db.term.findFirst();
    const activeSessionRecord = targetSessionId ? await db.session.findUnique({ where: { id: targetSessionId } }) : await db.session.findFirst();

    // Fetch other terms/sessions for which this student has results (historical checks)
    const availableChecks = await db.result.findMany({
      where: { studentId: student.id },
      select: {
        term: { select: { id: true, name: true } },
        session: { select: { id: true, name: true } }
      },
      distinct: ['termId', 'sessionId']
    });

    // 7. Increment token usage count and log details
    const newUsageCount = token.usageCount + 1;
    const newStatus = newUsageCount >= token.maxUsage ? 'Consumed' : 'Active';

    await db.token.update({
      where: { id: token.id },
      data: {
        usageCount: newUsageCount,
        status: newStatus,
      },
    });

    // Log the usage
    await db.tokenUsageLog.create({
      data: {
        tokenId: token.id,
        visitorName,
        ipAddress: ip,
        userAgent,
      },
    });

    // Log system audit event
    await db.auditLog.create({
      data: {
        action: 'Token Usage',
        details: `Public check for student ${student.fullName} (${student.id}) using token ${tokenString}. Visitor: ${visitorName}. Usage: ${newUsageCount}/3`,
        ipAddress: ip,
        userAgent,
      },
    });

    // Fetch attendance record for the student for this term & session
    const attendanceRecord = targetTermId && targetSessionId ? await db.attendance.findUnique({
      where: {
        studentId_termId_sessionId: {
          studentId: student.id,
          termId: targetTermId,
          sessionId: targetSessionId,
        },
      },
    }) : null;

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullName: student.fullName,
        gender: student.gender,
        class: student.class?.name || 'N/A',
        parentName: student.parentName,
      },
      term: activeTermRecord,
      session: activeSessionRecord,
      attendance: attendanceRecord ? {
        daysPresent: attendanceRecord.daysPresent,
        totalDays: attendanceRecord.totalDays,
        percentage: attendanceRecord.percentage,
        remark: attendanceRecord.remark,
      } : null,
      results: results.map((r) => ({
        subject: r.subject.name,
        caScore: r.caScore,
        examScore: r.examScore,
        totalScore: r.totalScore,
        grade: r.grade,
        remark: r.remark,
      })),
      availableChecks: availableChecks.map(c => ({
        termId: c.term.id,
        termName: c.term.name,
        sessionId: c.session.id,
        sessionName: c.session.name
      })),
      usageCount: newUsageCount,
      maxUsage: token.maxUsage,
    });
  } catch (error: any) {
    console.error('Public check result error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
