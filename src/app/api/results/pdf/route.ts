import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateReportCardPDF } from '@/services/pdf';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawStudentId = searchParams.get('studentId');
    const rawTermId = searchParams.get('termId');
    const rawSessionId = searchParams.get('sessionId');
    const rawClassId = searchParams.get('classId');
    const rawTokenStr = searchParams.get('token');
    const visitorName = (searchParams.get('visitorName') || 'Public Viewer').trim();

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const studentId = rawStudentId?.trim();
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // 1. Locate student by ID or Admission Number (case-insensitive)
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
      return NextResponse.json({ error: 'Student not found. Please verify the Student ID or Admission Number.' }, { status: 404 });
    }

    // 2. Authenticate - check if standard user session exists OR if a valid access token is provided
    let isAuthorized = false;
    const session = await getSession();

    if (session && ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT', 'BURSAR'].includes(session.role)) {
      isAuthorized = true;
    } else if (rawTokenStr) {
      const cleanToken = rawTokenStr.trim().toUpperCase();
      const token = await db.token.findFirst({
        where: {
          tokenString: { equals: cleanToken, mode: 'insensitive' },
        },
        include: { student: true },
      });

      if (!token) {
        return NextResponse.json({ error: 'Invalid token code.' }, { status: 401 });
      }

      if (token.studentId !== student.id) {
        return NextResponse.json({ error: 'This token is not registered for this student record.' }, { status: 401 });
      }

      if (token.status === 'Disabled') {
        return NextResponse.json({ error: 'Token has been disabled.' }, { status: 401 });
      }

      if (token.usageCount >= token.maxUsage || token.status === 'Expired' || token.status === 'Consumed') {
        return NextResponse.json({ error: 'Token has exceeded its maximum usage limit (3 checks).' }, { status: 401 });
      }

      // Token is valid - increment usage count and log details
      const newUsageCount = token.usageCount + 1;
      const newStatus = newUsageCount >= token.maxUsage ? 'Consumed' : 'Active';

      await db.token.update({
        where: { id: token.id },
        data: {
          usageCount: newUsageCount,
          status: newStatus,
        },
      });

      // Log token usage
      await db.tokenUsageLog.create({
        data: {
          tokenId: token.id,
          visitorName,
          ipAddress: ip,
          userAgent,
        },
      });

      // Audit log
      await db.auditLog.create({
        data: {
          action: 'Public Result Checked',
          details: `Public PDF downloaded for Student ${student.fullName} (${student.id}) using token ${cleanToken}. Visitor: ${visitorName}. Count: ${newUsageCount}/3`,
          ipAddress: ip,
          userAgent,
        },
      });

      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized result access. Please log in or provide a valid scratch card token.' }, { status: 401 });
    }

    // 3. Resolve target Academic Session and Term
    let resolvedSessionId = rawSessionId?.trim();
    let resolvedTermId = rawTermId?.trim();

    if (!resolvedSessionId) {
      const activeSession = await db.session.findFirst({ where: { active: true } });
      resolvedSessionId = activeSession?.id || student.sessionId;
    }

    if (!resolvedTermId) {
      const activeTerm = await db.term.findFirst({ where: { active: true } });
      resolvedTermId = activeTerm?.id;
    }

    // If still missing term or results are elsewhere, search student results
    if (!resolvedTermId || !resolvedSessionId) {
      const anyResult = await db.result.findFirst({
        where: { studentId: student.id },
        select: { termId: true, sessionId: true },
        orderBy: { createdAt: 'desc' },
      });
      if (anyResult) {
        if (!resolvedTermId) resolvedTermId = anyResult.termId;
        if (!resolvedSessionId) resolvedSessionId = anyResult.sessionId;
      }
    }

    const term = resolvedTermId ? await db.term.findUnique({ where: { id: resolvedTermId } }) : await db.term.findFirst();
    const sessionRecord = resolvedSessionId ? await db.session.findUnique({ where: { id: resolvedSessionId } }) : await db.session.findFirst();

    if (!term || !sessionRecord) {
      return NextResponse.json({ error: 'Academic session or term not found' }, { status: 404 });
    }

    // 4. Fetch results
    const results = await db.result.findMany({
      where: {
        studentId: student.id,
        termId: term.id,
        sessionId: sessionRecord.id,
      },
      include: {
        subject: true,
      },
      orderBy: {
        subject: { name: 'asc' },
      },
    });

    // 5. Fetch student's recorded attendance percentage and class for this term & session
    const attendanceRecord = await db.attendance.findUnique({
      where: {
        studentId_termId_sessionId: {
          studentId: student.id,
          termId: term.id,
          sessionId: sessionRecord.id,
        },
      },
      include: {
        class: true,
      },
    });

    const attendanceString = attendanceRecord
      ? `${attendanceRecord.percentage}%`
      : '95%';

    // Resolve student's original class for the target session
    let studentClassName = student.class?.name || 'Class N/A';
    if (rawClassId) {
      const explicitClass = await db.class.findUnique({ where: { id: rawClassId } });
      if (explicitClass) {
        studentClassName = explicitClass.name;
      }
    } else if (attendanceRecord?.class?.name) {
      studentClassName = attendanceRecord.class.name;
    } else if (student.sessionId !== sessionRecord.id) {
      const PROMOTION_ORDER = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'];
      const currentClassName = student.class?.name || '';
      const currentYear = parseInt(student.session?.name?.split('/')[0] || '0', 10);
      const targetYear = parseInt(sessionRecord.name?.split('/')[0] || '0', 10);

      if (currentClassName.startsWith('Graduating Students of') && currentClassName.includes(sessionRecord.name)) {
        studentClassName = 'SSS3';
      } else if (currentYear > 0 && targetYear > 0 && currentYear > targetYear) {
        const yearDiff = currentYear - targetYear;
        const currentIndex = PROMOTION_ORDER.indexOf(currentClassName);
        if (currentIndex !== -1 && currentIndex - yearDiff >= 0) {
          studentClassName = PROMOTION_ORDER[currentIndex - yearDiff];
        }
      }
    }

    // Format for PDF service
    const formattedStudent = {
      id: student.id,
      admissionNumber: student.admissionNumber,
      fullName: student.fullName,
      gender: student.gender,
      class: studentClassName,
      session: sessionRecord.name,
      term: term.name,
      parentName: student.parentName || 'Parent / Guardian',
    };

    const formattedResults = results.map((r) => ({
      subjectName: r.subject.name,
      caScore: r.caScore,
      examScore: r.examScore,
      totalScore: r.totalScore,
      grade: r.grade,
      remark: r.remark,
    }));

    // 6. Generate PDF buffer
    const pdfBuffer = await generateReportCardPDF(formattedStudent, formattedResults, attendanceString);

    // 6. Return PDF Stream
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="sggs_report_${student.id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
