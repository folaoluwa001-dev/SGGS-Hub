import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateReportCardPDF } from '@/services/pdf';
import JSZip from 'jszip';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const termId = searchParams.get('termId');
    const sessionId = searchParams.get('sessionId');

    if (!classId || !termId || !sessionId) {
      return NextResponse.json({ error: 'classId, termId, and sessionId are required' }, { status: 400 });
    }

    // 1. Authenticate - check if session exists and is SUPER_ADMIN
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access to bulk report cards' }, { status: 401 });
    }

    // 2. Fetch class, term, and session info
    const classRecord = await db.class.findUnique({ where: { id: classId } });
    const termRecord = await db.term.findUnique({ where: { id: termId } });
    const sessionRecord = await db.session.findUnique({ where: { id: sessionId } });

    if (!classRecord || !termRecord || !sessionRecord) {
      return NextResponse.json({ error: 'Class, Term, or Session not found' }, { status: 404 });
    }

    // 3. Fetch students in the target class
    const students = await db.student.findMany({
      where: { classId },
      include: {
        class: true,
        session: true
      },
      orderBy: { fullName: 'asc' }
    });

    if (students.length === 0) {
      return NextResponse.json({ error: 'No students registered in this class' }, { status: 400 });
    }

    // 4. Create ZIP and populate with student report cards
    const zip = new JSZip();

    for (const student of students) {
      // Fetch results for this student
      const results = await db.result.findMany({
        where: {
          studentId: student.id,
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
        term: termRecord.name,
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

      // Generate PDF buffer
      const pdfBuffer = await generateReportCardPDF(formattedStudent, formattedResults, "96%");
      
      // Clean student name for filename
      const cleanedStudentName = student.fullName.trim().replace(/\s+/g, '_');
      const cleanedClassName = classRecord.name.trim().replace(/\s+/g, '_');
      const pdfFilename = `${cleanedStudentName}_${cleanedClassName}_ReportCard.pdf`;

      zip.file(pdfFilename, pdfBuffer);
    }

    // 5. Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // 6. Name the ZIP file
    let termLabel = termRecord.name.replace(/\s+/g, '');
    if (termRecord.name.toLowerCase().includes('first')) termLabel = 'Term1';
    else if (termRecord.name.toLowerCase().includes('second')) termLabel = 'Term2';
    else if (termRecord.name.toLowerCase().includes('third')) termLabel = 'Term3';

    const cleanClassName = classRecord.name.trim().replace(/\s+/g, '_');
    const cleanSessionName = sessionRecord.name.replace(/\//g, '-');
    const zipFilename = `${cleanClassName}_Report_Cards_${cleanSessionName}_${termLabel}.zip`;

    // 7. Return ZIP Response
    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
      },
    });

  } catch (error: any) {
    console.error('Bulk PDF generation API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
