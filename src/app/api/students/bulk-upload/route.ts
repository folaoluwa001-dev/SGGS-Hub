import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';
import * as XLSX from 'xlsx';

// Helper to generate the next Student ID (e.g., SGGS-2026-0001) with index offset
async function generateStudentId(offset: number = 0): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `SGGS-${currentYear}-`;

  // Find the highest Student ID matching the current year
  const lastStudent = await db.student.findFirst({
    where: {
      id: {
        startsWith: prefix,
      },
    },
    orderBy: {
      id: 'desc',
    },
  });

  let nextNum = 1;
  if (lastStudent) {
    const lastNumStr = lastStudent.id.substring(prefix.length);
    const lastNum = parseInt(lastNumStr, 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  // Format to 4 digits: SGGS-2026-0001
  const paddedNum = String(nextNum + offset).padStart(4, '0');
  return `${prefix}${paddedNum}`;
}

// Helper to parse and validate date in Excel/CSV
function parseAndValidateDate(val: any): Date | null {
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'number') {
    // If SheetJS parses a number representing a date
    const date = new Date((val - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const date = new Date(trimmed);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    // Authenticate: Only super admins can upload student lists
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Parse formData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read workbook with SheetJS (detects CSV/XLSX automatically)
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON arrays (header: 1 returns array of arrays)
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

    if (rows.length < 2) {
      return NextResponse.json({ error: 'Spreadsheet must contain headers and at least one student record.' }, { status: 400 });
    }

    // Normalize headers for flexible mapping (lowercase, remove spaces, underscores, and hyphens)
    const headers = (rows[0] as any[]).map(h => 
      String(h || '').trim().toLowerCase().replace(/[\s_-]/g, '')
    );

    // Identify header positions
    const admissionIdx = headers.findIndex(h => h.includes('admission'));
    const nameIdx = headers.findIndex(h => h === 'fullname' || h === 'name' || h.includes('studentname'));
    const genderIdx = headers.findIndex(h => h === 'gender' || h === 'sex');
    const dobIdx = headers.findIndex(h => h === 'dateofbirth' || h === 'dob' || h.includes('birth'));
    const classIdx = headers.findIndex(h => h === 'class' || h.includes('classname') || h.includes('classarm'));
    const sessionIdx = headers.findIndex(h => h === 'session' || h.includes('sessionname'));
    const parentNameIdx = headers.findIndex(h => h.includes('parentname') || h.includes('guardianname') || h === 'parent' || h === 'guardian');
    const parentPhoneIdx = headers.findIndex(h => h.includes('parentphone') || h.includes('guardianphone') || h === 'parentphone' || h === 'phone');
    const parentEmailIdx = headers.findIndex(h => h.includes('parentemail') || h.includes('guardianemail') || h === 'email');
    const addressIdx = headers.findIndex(h => h.includes('address') || h === 'address');

    // Verify required headers
    const missingHeaders = [];
    if (admissionIdx === -1) missingHeaders.push('Admission Number');
    if (nameIdx === -1) missingHeaders.push('Full Name');
    if (genderIdx === -1) missingHeaders.push('Gender');
    if (dobIdx === -1) missingHeaders.push('Date of Birth');
    if (classIdx === -1) missingHeaders.push('Class Name');
    if (sessionIdx === -1) missingHeaders.push('Session Name');

    if (missingHeaders.length > 0) {
      return NextResponse.json({
        errors: [`Missing required column headers: ${missingHeaders.join(', ')}. Found columns: ${rows[0].filter(Boolean).join(', ')}`]
      }, { status: 400 });
    }

    // Load classes and sessions from database for cross-referencing
    const dbClasses = await db.class.findMany();
    const dbSessions = await db.session.findMany();

    const classMap = new Map(dbClasses.map(c => [c.name.toLowerCase().trim(), c.id]));
    const sessionMap = new Map(dbSessions.map(s => [s.name.toLowerCase().trim(), s.id]));

    // Fetch existing admission numbers from database to check duplicates
    const existingStudents = await db.student.findMany({ select: { admissionNumber: true } });
    const dbAdmissions = new Set(existingStudents.map(s => s.admissionNumber.toLowerCase().trim()));

    const errors: string[] = [];
    const validRows: any[] = [];
    const fileAdmissions = new Set<string>();

    // Validate rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Skip fully empty rows
      if (!row || row.length === 0 || row.every(cell => cell === null || String(cell).trim() === '')) {
        continue;
      }

      const rowNum = i + 1;

      // Extract details
      const admissionRaw = row[admissionIdx] !== undefined ? String(row[admissionIdx]).trim() : '';
      const fullNameRaw = row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
      const genderRaw = row[genderIdx] !== undefined ? String(row[genderIdx]).trim() : '';
      const dobRaw = row[dobIdx];
      const classNameRaw = row[classIdx] !== undefined ? String(row[classIdx]).trim() : '';
      const sessionNameRaw = row[sessionIdx] !== undefined ? String(row[sessionIdx]).trim() : '';

      const parentName = parentNameIdx !== -1 && row[parentNameIdx] !== undefined ? String(row[parentNameIdx]).trim() : '';
      const parentPhone = parentPhoneIdx !== -1 && row[parentPhoneIdx] !== undefined ? String(row[parentPhoneIdx]).trim() : '';
      const parentEmail = parentEmailIdx !== -1 && row[parentEmailIdx] !== undefined ? String(row[parentEmailIdx]).trim() : '';
      const address = addressIdx !== -1 && row[addressIdx] !== undefined ? String(row[addressIdx]).trim() : '';

      // Check required fields
      const rowMissingFields = [];
      if (!admissionRaw) rowMissingFields.push('Admission Number');
      if (!fullNameRaw) rowMissingFields.push('Full Name');
      if (!genderRaw) rowMissingFields.push('Gender');
      if (dobRaw === undefined || dobRaw === null || String(dobRaw).trim() === '') rowMissingFields.push('Date of Birth');
      if (!classNameRaw) rowMissingFields.push('Class Name');
      if (!sessionNameRaw) rowMissingFields.push('Session Name');

      if (rowMissingFields.length > 0) {
        errors.push(`Row ${rowNum}: Missing required values for: ${rowMissingFields.join(', ')}.`);
        continue;
      }

      // Gender validation
      const normalizedGender = genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1).toLowerCase();
      if (normalizedGender !== 'Male' && normalizedGender !== 'Female') {
        errors.push(`Row ${rowNum} (${fullNameRaw}): Gender must be "Male" or "Female" (found "${genderRaw}").`);
      }

      // Date of birth validation
      const parsedDob = parseAndValidateDate(dobRaw);
      if (!parsedDob) {
        errors.push(`Row ${rowNum} (${fullNameRaw}): Invalid Date of Birth format (found "${dobRaw}"). Please use YYYY-MM-DD.`);
      }

      // Class existence validation
      const classId = classMap.get(classNameRaw.toLowerCase());
      if (!classId) {
        errors.push(`Row ${rowNum} (${fullNameRaw}): Class "${classNameRaw}" does not exist. Supported classes: ${dbClasses.map(c => c.name).join(', ')}.`);
      }

      // Session existence validation
      const sessionId = sessionMap.get(sessionNameRaw.toLowerCase());
      if (!sessionId) {
        errors.push(`Row ${rowNum} (${fullNameRaw}): Session "${sessionNameRaw}" does not exist. Supported sessions: ${dbSessions.map(s => s.name).join(', ')}.`);
      }

      // Duplicate Admission Number validation
      const admissionKey = admissionRaw.toLowerCase();
      if (dbAdmissions.has(admissionKey)) {
        errors.push(`Row ${rowNum} (${fullNameRaw}): Admission Number "${admissionRaw}" already exists in the database.`);
      }
      if (fileAdmissions.has(admissionKey)) {
        errors.push(`Row ${rowNum} (${fullNameRaw}): Duplicate Admission Number "${admissionRaw}" found within this spreadsheet.`);
      }
      fileAdmissions.add(admissionKey);

      // Collect data if no errors found yet (we fail the entire batch anyway if any error is collected)
      if (errors.length === 0) {
        validRows.push({
          admissionNumber: admissionRaw,
          fullName: fullNameRaw,
          gender: normalizedGender,
          dateOfBirth: parsedDob || new Date(),
          address,
          parentName,
          parentPhone,
          parentEmail,
          classId: classId || '',
          sessionId: sessionId || '',
        });
      }
    }

    // If there are validation errors, return them immediately
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    if (validRows.length === 0) {
      return NextResponse.json({ error: 'No valid student records found in the spreadsheet.' }, { status: 400 });
    }

    // Bulk creation within database transaction
    await db.$transaction(async (tx) => {
      for (let index = 0; index < validRows.length; index++) {
        const studentData = validRows[index];
        const studentId = await generateStudentId(index);

        const student = await tx.student.create({
          data: {
            id: studentId,
            admissionNumber: studentData.admissionNumber,
            fullName: studentData.fullName,
            gender: studentData.gender,
            dateOfBirth: studentData.dateOfBirth,
            address: studentData.address,
            parentName: studentData.parentName,
            parentPhone: studentData.parentPhone,
            parentEmail: studentData.parentEmail,
            classId: studentData.classId,
            sessionId: studentData.sessionId,
          },
        });

        // Instantiate fee payments based on the class's default fee categories
        const feeCategories = await tx.feeCategory.findMany({
          where: { classId: student.classId },
        });

        for (let f = 0; f < feeCategories.length; f++) {
          const category = feeCategories[f];
          // Use sequential markers to guarantee absolute uniqueness under heavy concurrent load
          const receiptNum = `REC-${Date.now()}-${index}-${f}-${Math.floor(1000 + Math.random() * 9000)}`;

          await tx.payment.create({
            data: {
              studentId: student.id,
              amountPaid: 0,
              totalExpected: category.defaultAmount,
              balance: category.defaultAmount,
              category: category.name,
              receiptNumber: receiptNum,
              recordedBy: sessionUser.userId,
            },
          });
        }
      }
    });

    // Log the bulk import audit trail
    await logAuditEvent(
      'Student Bulk Upload',
      `Successfully bulk registered ${validRows.length} student records and initialized their fee schedules via spreadsheet import.`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, count: validRows.length });
  } catch (error: any) {
    console.error('Bulk Upload Error:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
