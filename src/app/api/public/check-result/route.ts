import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { studentId, tokenString, visitorName, termId, sessionId } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    if (!studentId || !tokenString || !visitorName) {
      return NextResponse.json({ error: 'Student ID, Token, and Visitor Name are required' }, { status: 400 });
    }

    // 1. Verify Student ID
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        session: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Invalid Student ID. Student record not found.' }, { status: 404 });
    }

    // 2. Verify Token
    const token = await db.token.findUnique({
      where: { tokenString: tokenString },
    });

    if (!token) {
      return NextResponse.json({ error: 'Invalid Token code. Double check the spelling.' }, { status: 401 });
    }

    // 3. Verify Token Ownership
    if (token.studentId !== studentId) {
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

    if (!targetSessionId || !targetTermId) {
      const activeSessionSetting = await db.settings.findUnique({ where: { key: 'current_session_id' } });
      const activeTermSetting = await db.settings.findUnique({ where: { key: 'current_term_id' } });
      
      targetSessionId = targetSessionId || activeSessionSetting?.value || student.sessionId;
      targetTermId = targetTermId || activeTermSetting?.value;
    }

    if (!targetTermId) {
      // Fallback to any term that has results
      const firstResult = await db.result.findFirst({
        where: { studentId },
        select: { termId: true, sessionId: true }
      });
      targetTermId = firstResult?.termId;
      targetSessionId = targetSessionId || firstResult?.sessionId;
    }

    // If still no term, find first term in DB
    if (!targetTermId) {
      const firstTerm = await db.term.findFirst();
      targetTermId = firstTerm?.id;
    }

    // 6. Fetch results for the target session/term
    const results = await db.result.findMany({
      where: {
        studentId,
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

    const activeTermRecord = await db.term.findUnique({ where: { id: targetTermId } });
    const activeSessionRecord = await db.session.findUnique({ where: { id: targetSessionId } });

    // Fetch other terms/sessions for which this student has results (historical checks)
    const availableChecks = await db.result.findMany({
      where: { studentId },
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
        details: `Public check for student ${student.fullName} (${studentId}) using token ${tokenString}. Visitor: ${visitorName}. Usage: ${newUsageCount}/3`,
        ipAddress: ip,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullName: student.fullName,
        gender: student.gender,
        class: student.class.name,
        parentName: student.parentName,
      },
      term: activeTermRecord,
      session: activeSessionRecord,
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
