import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    // Authenticate: Only super admins can upload combined marksheets
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Parse formData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const classCategory = formData.get('classCategory') as string | null;
    const termId = formData.get('termId') as string | null;
    const sessionId = formData.get('sessionId') as string | null;

    if (!file || !classCategory || !termId || !sessionId) {
      return NextResponse.json({ error: 'Missing required parameters (file, classCategory, termId, sessionId).' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to array of arrays
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

    if (rows.length < 2) {
      return NextResponse.json({ error: 'Spreadsheet is empty or lacks header rows.' }, { status: 400 });
    }

    // Load all subjects from database to match columns
    const dbSubjects = await db.subject.findMany();
    const subjectMapByName = new Map<string, any>();
    for (const s of dbSubjects) {
      subjectMapByName.set(s.name.trim().toLowerCase(), s);
    }

    // Map column index to subjects
    const columnsMap: Array<{
      subjectId: string;
      subjectName: string;
      caColIdx: number;
      examColIdx: number;
    }> = [];

    // Row 1 (rows[0]) contains subject names. Loop starting from index 1 (Column B) with step 2
    for (let c = 1; c < rows[0].length; c += 2) {
      const subjectName = String(rows[0][c] || '').trim();
      if (!subjectName) continue;

      const subjectRecord = subjectMapByName.get(subjectName.toLowerCase());
      if (!subjectRecord) {
        return NextResponse.json({
          errors: [`Subject "${subjectName}" in column index ${c + 1} is not registered in the database.`]
        }, { status: 400 });
      }

      // Check sub-headers in Row 2 (rows[1])
      const caHeader = String(rows[1][c] || '').trim().toUpperCase();
      const examHeader = String(rows[1][c + 1] || '').trim().toUpperCase();

      if (caHeader !== 'CA' || examHeader !== 'EXAM') {
        return NextResponse.json({
          errors: [`Column headers at index ${c + 1} and ${c + 2} must be "CA" and "Exam" respectively. Found "${caHeader}" and "${examHeader}".`]
        }, { status: 400 });
      }

      columnsMap.push({
        subjectId: subjectRecord.id,
        subjectName: subjectRecord.name,
        caColIdx: c,
        examColIdx: c + 1
      });
    }

    if (columnsMap.length === 0) {
      return NextResponse.json({ error: 'No valid subject columns found in the spreadsheet.' }, { status: 400 });
    }

    // Get all valid student IDs in this class category for validation
    const allClasses = await db.class.findMany();
    const matchedClasses = allClasses.filter(c => 
      c.name.trim().toUpperCase().startsWith(classCategory.trim().toUpperCase())
    );
    const classIds = matchedClasses.map(c => c.id);

    const validStudents = await db.student.findMany({
      where: {
        classId: { in: classIds },
        sessionId: sessionId
      },
      select: { id: true }
    });
    const validStudentIds = new Set(validStudents.map(s => s.id));

    const errors: string[] = [];
    const resultsToUpsert: any[] = [];
    const resultsToDelete: any[] = [];

    // Parse data rows starting from row index 2 (Row 3 in Excel)
    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];

      // Skip fully empty rows
      if (!row || row.length === 0 || row.every(cell => cell === null || String(cell).trim() === '')) {
        continue;
      }

      const studentCell = String(row[0] || '').trim();
      if (!studentCell) {
        errors.push(`Row ${r + 1}: Missing Student Name & ID in Column A.`);
        continue;
      }

      // Extract Student ID using regex matching "Name (ID)"
      const match = studentCell.match(/\(([^)]+)\)$/);
      if (!match) {
        errors.push(`Row ${r + 1}: Column A must be in the format "FullName (ID)". Found: "${studentCell}".`);
        continue;
      }

      const studentId = match[1].trim();

      // Check if student belongs to the selected class category and session
      if (!validStudentIds.has(studentId)) {
        errors.push(`Row ${r + 1}: Student with ID "${studentId}" is not registered in Class Category "${classCategory}" for this academic session.`);
        continue;
      }

      // Loop through qualifying columns for this student
      for (const col of columnsMap) {
        const caRaw = row[col.caColIdx];
        const examRaw = row[col.examColIdx];

        const caStr = caRaw !== undefined && caRaw !== null ? String(caRaw).trim() : '';
        const examStr = examRaw !== undefined && examRaw !== null ? String(examRaw).trim() : '';

        // If both columns are blank, it means we should delete this result
        if (caStr === '' && examStr === '') {
          resultsToDelete.push({
            studentId,
            subjectId: col.subjectId
          });
          continue;
        }

        // If only one is filled, default the other to 0
        const caScore = caStr === '' ? 0 : parseFloat(caStr);
        const examScore = examStr === '' ? 0 : parseFloat(examStr);

        if (isNaN(caScore) || isNaN(examScore)) {
          errors.push(`Row ${r + 1} (${studentId}): Scores for "${col.subjectName}" must be numeric. Found CA: "${caStr}", Exam: "${examStr}".`);
          continue;
        }

        // Range validations
        if (caScore < 0 || caScore > 30) {
          errors.push(`Row ${r + 1} (${studentId}): CA Score for "${col.subjectName}" must be between 0 and 30. Found ${caScore}.`);
        }

        if (examScore < 0 || examScore > 70) {
          errors.push(`Row ${r + 1} (${studentId}): Exam Score for "${col.subjectName}" must be between 0 and 70. Found ${examScore}.`);
        }

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

        resultsToUpsert.push({
          studentId,
          subjectId: col.subjectId,
          caScore,
          examScore,
          totalScore,
          grade,
          remark
        });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    let recordsUpdated = 0;
    let recordsDeleted = 0;

    // Run DB changes in a transaction
    await db.$transaction(async (tx) => {
      // 1. Process deletions
      for (const del of resultsToDelete) {
        const existing = await tx.result.findUnique({
          where: {
            studentId_subjectId_termId_sessionId: {
              studentId: del.studentId,
              subjectId: del.subjectId,
              termId,
              sessionId
            }
          }
        });
        if (existing) {
          await tx.result.delete({
            where: { id: existing.id }
          });
          recordsDeleted++;
        }
      }

      // 2. Process upserts
      for (const up of resultsToUpsert) {
        await tx.result.upsert({
          where: {
            studentId_subjectId_termId_sessionId: {
              studentId: up.studentId,
              subjectId: up.subjectId,
              termId,
              sessionId
            }
          },
          update: {
            caScore: up.caScore,
            examScore: up.examScore,
            totalScore: up.totalScore,
            grade: up.grade,
            remark: up.remark
          },
          create: {
            studentId: up.studentId,
            subjectId: up.subjectId,
            termId,
            sessionId,
            caScore: up.caScore,
            examScore: up.examScore,
            totalScore: up.totalScore,
            grade: up.grade,
            remark: up.remark
          }
        });
        recordsUpdated++;
      }
    });

    // Log audit event
    await logAuditEvent(
      'Combined Marksheet Uploaded',
      `Uploaded marksheet for Class Category "${classCategory}". Updated: ${recordsUpdated}, Deleted: ${recordsDeleted}.`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json({
      success: true,
      updatedCount: recordsUpdated,
      deletedCount: recordsDeleted
    });

  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
