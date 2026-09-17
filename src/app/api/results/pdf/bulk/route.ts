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

    // 3. Find students who attended or had results for this class in this session & term
    const PROMOTION_ORDER = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'];
    const targetSessionYear = parseInt(sessionRecord.name.split('/')[0] || '0', 10);

    // (a) Find candidate students who have attendance or results for this session & term
    const candidateResults = await db.result.findMany({
      where: {
        sessionId: sessionRecord.id,
        termId: termRecord.id,
      },
      select: { studentId: true },
      distinct: ['studentId'],
    });

    const candidateAttendance = await db.attendance.findMany({
      where: {
        sessionId: sessionRecord.id,
        termId: termRecord.id,
      },
      select: { studentId: true, classId: true },
    });

    const attClassMap = new Map<string, string>();
    candidateAttendance.forEach((a) => attClassMap.set(a.studentId, a.classId));

    const candidateIds = new Set<string>();
    candidateResults.forEach((r) => candidateIds.add(r.studentId));
    candidateAttendance.forEach((a) => candidateIds.add(a.studentId));

    // Also include students currently assigned to this class and session
    const currentStudents = await db.student.findMany({
      where: { classId: classRecord.id },
      select: { id: true, sessionId: true },
    });
    currentStudents.forEach((s) => {
      if (s.sessionId === sessionRecord.id) {
        candidateIds.add(s.id);
      }
    });

    // Fetch student records
    const allCandidateStudents = await db.student.findMany({
      where: { id: { in: Array.from(candidateIds) } },
      include: {
        class: true,
        session: true,
      },
      orderBy: { fullName: 'asc' },
    });

    // Filter students whose resolved class for this session matches target classRecord
    const students = allCandidateStudents.filter((student) => {
      // 1. Exact attendance class match
      if (attClassMap.has(student.id)) {
        return attClassMap.get(student.id) === classRecord.id;
      }
      // 2. Same session match
      if (student.sessionId === sessionRecord.id && student.classId === classRecord.id) {
        return true;
      }
      // 3. Promotion ladder check
      const studentSessionYear = parseInt(student.session?.name?.split('/')[0] || '0', 10);
      const currentClassName = student.class?.name || '';
      if (currentClassName.startsWith('Graduating Students of') && currentClassName.includes(sessionRecord.name)) {
        return classRecord.name === 'SSS3';
      }
      if (studentSessionYear > 0 && targetSessionYear > 0 && studentSessionYear > targetSessionYear) {
        const yearDiff = studentSessionYear - targetSessionYear;
        const currentIndex = PROMOTION_ORDER.indexOf(currentClassName);
        if (currentIndex !== -1 && currentIndex - yearDiff >= 0) {
          return PROMOTION_ORDER[currentIndex - yearDiff] === classRecord.name;
        }
      }
      return student.classId === classRecord.id;
    });

    if (students.length === 0) {
      return NextResponse.json({ error: `No student records found for ${classRecord.name} in ${sessionRecord.name} (${termRecord.name}).` }, { status: 400 });
    }

    // Pre-fetch attendance records for all class students in this term & session
    const attendanceRecords = await db.attendance.findMany({
      where: {
        sessionId: sessionRecord.id,
        termId: termRecord.id,
      },
    });
    const attendanceMap = new Map<string, number>();
    attendanceRecords.forEach((a) => attendanceMap.set(a.studentId, a.percentage));

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

      // Format for PDF service - use classRecord.name to ensure correct session class
      const formattedStudent = {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullName: student.fullName,
        gender: student.gender,
        class: classRecord.name,
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

      // Generate PDF buffer using recorded attendance or fallback
      const studentAttendanceStr = attendanceMap.has(student.id)
        ? `${attendanceMap.get(student.id)}%`
        : "95%";
      const pdfBuffer = await generateReportCardPDF(formattedStudent, formattedResults, studentAttendanceStr);
      
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
