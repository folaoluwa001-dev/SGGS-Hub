import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    // Authenticate: Only super admins and teachers can upload results
    const sessionUser = await requireAuth(['SUPER_ADMIN', 'TEACHER']);
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Parse formData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const classId = formData.get('classId') as string | null;
    const subjectId = formData.get('subjectId') as string | null;
    const termId = formData.get('termId') as string | null;
    const sessionId = formData.get('sessionId') as string | null;

    if (!file || !classId || !subjectId || !termId || !sessionId) {
      return NextResponse.json({ error: 'Missing required upload parameters (file, classId, subjectId, termId, sessionId).' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read workbook with SheetJS (detects CSV/XLSX/XLS automatically)
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON arrays (header: 1 returns array of arrays)
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

    if (rows.length < 2) {
      return NextResponse.json({ error: 'Spreadsheet is empty or lacks headers.' }, { status: 400 });
    }

    // Normalize headers for flexible mapping (lowercase, remove spaces, underscores, and hyphens)
    const headers = (rows[0] as any[]).map(h => 
      String(h || '').trim().toLowerCase().replace(/[\s_-]/g, '')
    );

    // Identify header positions
    const studentIdIdx = headers.findIndex(h => h === 'studentid' || h === 'id' || h.includes('student') && h.includes('id'));
    const caIdx = headers.findIndex(h => h === 'cascore' || h === 'ca' || h.includes('ca') && h.includes('score'));
    const examIdx = headers.findIndex(h => h === 'examscore' || h === 'exam' || h.includes('exam') && h.includes('score'));

    // Verify required headers
    const missingHeaders = [];
    if (studentIdIdx === -1) missingHeaders.push('Student ID');
    if (caIdx === -1) missingHeaders.push('CA Score');
    if (examIdx === -1) missingHeaders.push('Exam Score');

    if (missingHeaders.length > 0) {
      return NextResponse.json({
        errors: [`Missing required column headers: ${missingHeaders.join(', ')}. Found columns: ${rows[0].filter(Boolean).join(', ')}`]
      }, { status: 400 });
    }

    // Load students in this class for validation
    const studentsInClass = await db.student.findMany({
      where: { classId },
      select: { id: true, fullName: true }
    });
    const studentIdsMap = new Set(studentsInClass.map(s => s.id));

    const errors: string[] = [];
    const resultsToUpsert: any[] = [];

    // Process rows starting from index 1 (skip headers)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Skip fully empty rows
      if (!row || row.length === 0 || row.every(cell => cell === null || String(cell).trim() === '')) {
        continue;
      }

      const rowNum = i + 1;

      // Extract values
      const studentId = row[studentIdIdx] !== undefined ? String(row[studentIdIdx]).trim() : '';
      const caRaw = row[caIdx];
      const examRaw = row[examIdx];

      if (!studentId) {
        errors.push(`Row ${rowNum}: Missing Student ID.`);
        continue;
      }

      // Check if student belongs to the class
      if (!studentIdsMap.has(studentId)) {
        errors.push(`Row ${rowNum}: Student ID '${studentId}' does not belong to the selected Class Arm.`);
        continue;
      }

      // Validate scores are numeric
      const caScore = parseFloat(String(caRaw).trim());
      const examScore = parseFloat(String(examRaw).trim());

      if (isNaN(caScore) || isNaN(examScore)) {
        errors.push(`Row ${rowNum} (${studentId}): Scores must be numeric values. Found CA: "${caRaw}", Exam: "${examRaw}".`);
        continue;
      }

      // Range validations
      if (caScore < 0 || caScore > 30) {
        errors.push(`Row ${rowNum} (${studentId}): CA Score must be between 0 and 30. Found ${caScore}.`);
      }

      if (examScore < 0 || examScore > 70) {
        errors.push(`Row ${rowNum} (${studentId}): Exam Score must be between 0 and 70. Found ${examScore}.`);
      }

      // Compute grade and remark
      const totalScore = caScore + examScore;
      let grade = 'F';
      let remark = 'Fail';

      if (totalScore >= 70) {
        grade = 'A';
        remark = 'Excellent';
      } else if (totalScore >= 60) {
        grade = 'B';
        remark = 'Very Good';
      } else if (totalScore >= 50) {
        grade = 'C';
        remark = 'Good';
      } else if (totalScore >= 45) {
        grade = 'D';
        remark = 'Fair';
      } else if (totalScore >= 40) {
        grade = 'E';
        remark = 'Pass';
      }

      if (errors.length === 0) {
        resultsToUpsert.push({
          studentId,
          subjectId,
          termId,
          sessionId,
          caScore,
          examScore,
          totalScore,
          grade,
          remark
        });
      }
    }

    // Return all validation errors if any were found
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    if (resultsToUpsert.length === 0) {
      return NextResponse.json({ error: 'No valid grading records found in the spreadsheet.' }, { status: 400 });
    }

    // DB Upsert in a transaction
    let recordsSynced = 0;
    await db.$transaction(async (tx) => {
      for (const resItem of resultsToUpsert) {
        await tx.result.upsert({
          where: {
            studentId_subjectId_termId_sessionId: {
              studentId: resItem.studentId,
              subjectId: resItem.subjectId,
              termId: resItem.termId,
              sessionId: resItem.sessionId
            }
          },
          update: {
            caScore: resItem.caScore,
            examScore: resItem.examScore,
            totalScore: resItem.totalScore,
            grade: resItem.grade,
            remark: resItem.remark
          },
          create: {
            studentId: resItem.studentId,
            subjectId: resItem.subjectId,
            termId: resItem.termId,
            sessionId: resItem.sessionId,
            caScore: resItem.caScore,
            examScore: resItem.examScore,
            totalScore: resItem.totalScore,
            grade: resItem.grade,
            remark: resItem.remark
          }
        });
        recordsSynced++;
      }
    });

    // Log audit event
    await logAuditEvent(
      'Direct Result Upload',
      `Imported/updated grades for ${recordsSynced} students in Class ID ${classId}, Subject ID ${subjectId}, Term ID ${termId}, Session ID ${sessionId} via direct file upload.`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, recordsSynced });
  } catch (error: any) {
    console.error('Direct Result Upload Error:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
