import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateReportCardPDF } from '@/services/pdf';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const termId = searchParams.get('termId');
    const sessionId = searchParams.get('sessionId');
    const tokenStr = searchParams.get('token');
    const visitorName = searchParams.get('visitorName') || 'Public Viewer';

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    if (!studentId || !termId || !sessionId) {
      return NextResponse.json({ error: 'studentId, termId, and sessionId are required' }, { status: 400 });
    }

    // 1. Authenticate - check if standard user session exists OR if a valid access token is provided
    let isAuthorized = false;
    const session = await getSession();

    if (session && ['SUPER_ADMIN', 'TEACHER', 'PARENT'].includes(session.role)) {
      isAuthorized = true;
    } else if (tokenStr) {
      // 2. Token-based Authentication for Public Result Checker
      const token = await db.token.findUnique({
        where: { tokenString: tokenStr },
        include: { student: true }
      });

      if (!token) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      if (token.studentId !== studentId) {
        return NextResponse.json({ error: 'Token does not belong to this student' }, { status: 401 });
      }

      if (token.status === 'Disabled') {
        return NextResponse.json({ error: 'Token has been disabled' }, { status: 401 });
      }

      if (token.usageCount >= token.maxUsage || token.status === 'Expired' || token.status === 'Consumed') {
        return NextResponse.json({ error: 'Token has exceeded its usage limit (max 3)' }, { status: 401 });
      }

      // Token is valid! Increment usage count and log details
      const newUsageCount = token.usageCount + 1;
      const newStatus = newUsageCount >= token.maxUsage ? 'Consumed' : 'Active';

      await db.token.update({
        where: { id: token.id },
        data: {
          usageCount: newUsageCount,
          status: newStatus
        }
      });

      // Log token usage
      await db.tokenUsageLog.create({
        data: {
          tokenId: token.id,
          visitorName,
          ipAddress: ip,
          userAgent
        }
      });

      // Log audit log
      await db.auditLog.create({
        data: {
          action: 'Public Result Checked',
          details: `Public check for Student ${studentId} using token ${tokenStr}. Visitor: ${visitorName}. Count: ${newUsageCount}/3`,
          ipAddress: ip,
          userAgent
        }
      });

      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized result access' }, { status: 401 });
    }

    // 3. Fetch Student and results data
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        session: true
      }
    });

    const term = await db.term.findUnique({ where: { id: termId } });
    const sessionRecord = await db.session.findUnique({ where: { id: sessionId } });

    if (!student || !term || !sessionRecord) {
      return NextResponse.json({ error: 'Student, Term, or Session not found' }, { status: 404 });
    }

    const results = await db.result.findMany({
      where: {
        studentId,
        termId,
        sessionId
      },
      include: {
        subject: true
      },
      orderBy: {
        subject: { name: 'asc' }
      }
    });

    // Format for PDF service
    const formattedStudent = {
      id: student.id,
      admissionNumber: student.admissionNumber,
      fullName: student.fullName,
      gender: student.gender,
      class: student.class.name,
      session: sessionRecord.name,
      term: term.name,
      parentName: student.parentName
    };

    const formattedResults = results.map(r => ({
      subjectName: r.subject.name,
      caScore: r.caScore,
      examScore: r.examScore,
      totalScore: r.totalScore,
      grade: r.grade,
      remark: r.remark
    }));

    // 4. Generate PDF buffer
    const pdfBuffer = await generateReportCardPDF(formattedStudent, formattedResults, "96%");

    // 5. Return PDF Stream
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
