import { db } from '../lib/db';

interface SyncResult {
  success: boolean;
  recordsSynced: number;
  errors: string[];
  logId?: string;
}

/**
 * Helper to extract Google Spreadsheet ID from a URL
 */
export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return '';
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : urlOrId.trim();
}

/**
 * Generates a CSV template populated with students of a class
 */
export async function generateTemplateCSV(classId: string): Promise<string> {
  const students = await db.student.findMany({
    where: { classId },
    orderBy: { fullName: 'asc' },
  });

  // Separate boys and girls. Since they are already fetched ordered by fullName: 'asc',
  // both filtered lists will remain sorted alphabetically.
  const boys = students.filter(s => s.gender.toLowerCase() === 'male');
  const girls = students.filter(s => s.gender.toLowerCase() === 'female');
  const sortedStudents = [...boys, ...girls];

  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  csvContent += 'Student ID,Student Name,CA Score,Exam Score\n';

  sortedStudents.forEach((student) => {
    // Escape commas in student names
    const escapedName = student.fullName.includes(',') 
      ? `"${student.fullName}"` 
      : student.fullName;
    csvContent += `${student.id},${escapedName},,\n`;
  });

  return csvContent;
}

/**
 * Fetches and parses CSV from Google Sheet, validates, and syncs to database
 */
export async function syncScoresFromGoogleSheet(
  spreadsheetUrlOrId: string,
  classId: string,
  subjectId: string,
  termId: string,
  sessionId: string,
  teacherId: string
): Promise<SyncResult> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetUrlOrId);
  if (!spreadsheetId) {
    return { success: false, recordsSynced: 0, errors: ['Invalid Google Sheet URL or Spreadsheet ID'] };
  }

  // Google Sheets export URL for CSV
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  const errors: string[] = [];
  let recordsSynced = 0;

  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet. HTTP status: ${response.status}. Ensure the sheet sharing is set to "Anyone with the link can view".`);
    }

    const csvText = await response.text();
    const rows = csvText.split('\n').map(row => {
      // Simple CSV parser supporting quotes
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });

    if (rows.length < 2) {
      return { success: false, recordsSynced: 0, errors: ['Spreadsheet is empty or lacks headers.'] };
    }

    // Verify headers (case-insensitive check)
    const headers = rows[0].map(h => h.replace(/^\uFEFF/, '').toLowerCase());
    const studentIdIndex = headers.indexOf('student id');
    const caIndex = headers.indexOf('ca score');
    const examIndex = headers.indexOf('exam score');

    if (studentIdIndex === -1 || caIndex === -1 || examIndex === -1) {
      return {
        success: false,
        recordsSynced: 0,
        errors: [`Invalid headers. Required: 'Student ID', 'CA Score', 'Exam Score'. Found headers: ${rows[0].join(', ')}`]
      };
    }

    const studentsInClass = await db.student.findMany({
      where: { classId },
      select: { id: true, fullName: true }
    });
    const studentIdsMap = new Set(studentsInClass.map(s => s.id));

    // Process data rows
    const resultsToUpsert = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Skip empty rows
      if (!row || row.length < 2 || !row[studentIdIndex]) continue;

      const studentId = row[studentIdIndex];
      const caRaw = row[caIndex];
      const examRaw = row[examIndex];

      // Validate student belongs to this class
      if (!studentIdsMap.has(studentId)) {
        errors.push(`Row ${i + 1}: Student ID '${studentId}' does not belong to the selected class.`);
        continue;
      }

      // Validate scores are numbers
      const caScore = parseFloat(caRaw);
      const examScore = parseFloat(examRaw);

      if (isNaN(caScore) || isNaN(examScore)) {
        errors.push(`Row ${i + 1} (${studentId}): Scores must be numeric values. Found CA: "${caRaw}", Exam: "${examRaw}".`);
        continue;
      }

      // Score boundaries validation
      if (caScore < 0 || caScore > 30) {
        errors.push(`Row ${i + 1} (${studentId}): CA Score must be between 0 and 30. Found ${caScore}.`);
        continue;
      }

      if (examScore < 0 || examScore > 70) {
        errors.push(`Row ${i + 1} (${studentId}): Exam Score must be between 0 and 70. Found ${examScore}.`);
        continue;
      }

      // Compute grade
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

    // Write valid results to DB
    for (const result of resultsToUpsert) {
      await db.result.upsert({
        where: {
          studentId_subjectId_termId_sessionId: {
            studentId: result.studentId,
            subjectId: result.subjectId,
            termId: result.termId,
            sessionId: result.sessionId
          }
        },
        update: {
          caScore: result.caScore,
          examScore: result.examScore,
          totalScore: result.totalScore,
          grade: result.grade,
          remark: result.remark
        },
        create: {
          studentId: result.studentId,
          subjectId: result.subjectId,
          termId: result.termId,
          sessionId: result.sessionId,
          caScore: result.caScore,
          examScore: result.examScore,
          totalScore: result.totalScore,
          grade: result.grade,
          remark: result.remark
        }
      });
      recordsSynced++;
    }

    const hasErrors = errors.length > 0;
    const syncStatus = hasErrors ? (recordsSynced > 0 ? 'Partial' : 'Failed') : 'Success';

    // Log the sync event
    const syncLog = await db.googleSheetSyncLog.create({
      data: {
        teacherId,
        subjectId,
        classId,
        status: syncStatus,
        recordsSynced,
        errorMessage: hasErrors ? errors.slice(0, 10).join('; ') : null
      }
    });

    // Log audit trail
    await db.auditLog.create({
      data: {
        action: 'Google Sheet Sync',
        details: `Sync event ${syncStatus}: ${recordsSynced} records imported for class ${classId}, subject ${subjectId}. Errors: ${errors.length}`,
        userId: teacherId,
        ipAddress: '127.0.0.1',
        userAgent: 'Google Sheet Sync Handler'
      }
    });

    return {
      success: recordsSynced > 0,
      recordsSynced,
      errors,
      logId: syncLog.id
    };

  } catch (error: any) {
    console.error('Google Sheet Sync Error:', error);
    
    // Log failure in sync logs
    const syncLog = await db.googleSheetSyncLog.create({
      data: {
        teacherId,
        subjectId,
        classId,
        status: 'Failed',
        recordsSynced: 0,
        errorMessage: error.message
      }
    });

    return {
      success: false,
      recordsSynced: 0,
      errors: [error.message]
    };
  }
}
