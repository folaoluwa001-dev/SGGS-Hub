import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

/**
 * Helper to generate the next Student ID (e.g., SGGS-2026-0001)
 */
async function generateStudentId(): Promise<string> {
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
  const paddedNum = String(nextNum).padStart(4, '0');
  return `${prefix}${paddedNum}`;
}

// 1. GET: Fetch list of students
export async function GET(request: Request) {
  try {
    // Authenticate (Admin, Teacher, and Bursar can view students)
    await requireAuth(['SUPER_ADMIN', 'TEACHER', 'BURSAR']);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const sessionId = searchParams.get('sessionId') || '';

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search } },
        { id: { contains: search } },
        { admissionNumber: { contains: search } },
      ];
    }

    if (classId) {
      whereClause.classId = classId;
    }

    if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    const students = await db.student.findMany({
      where: whereClause,
      include: {
        class: true,
        session: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    return NextResponse.json(students);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. POST: Create a new student
export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const body = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const {
      admissionNumber,
      fullName,
      gender,
      dateOfBirth,
      address,
      parentName,
      parentPhone,
      parentEmail,
      classId,
      sessionId,
      passportPhotograph,
    } = body;

    // Validation
    if (!admissionNumber || !fullName || !gender || !dateOfBirth || !classId || !sessionId) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
    }

    // Check if admission number is unique
    const existing = await db.student.findUnique({
      where: { admissionNumber },
    });

    if (existing) {
      return NextResponse.json({ error: `Admission number ${admissionNumber} already exists.` }, { status: 400 });
    }

    // Automatically generate Student ID
    const studentId = await generateStudentId();

    const student = await db.student.create({
      data: {
        id: studentId,
        admissionNumber,
        fullName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        address: address || '',
        parentName: parentName || '',
        parentPhone: parentPhone || '',
        parentEmail: parentEmail || '',
        classId,
        sessionId,
        passportPhotograph: passportPhotograph || null,
      },
      include: {
        class: true,
        session: true,
      },
    });

    // Automatically set up fee outstanding records based on class fee categories
    const feeCategories = await db.feeCategory.findMany({
      where: { classId },
    });

    for (const category of feeCategories) {
      const receiptNum = `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.payment.create({
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

    await logAuditEvent(
      'Student Created',
      `Student ${fullName} (${studentId}) registered under admission ${admissionNumber}`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    console.error('Create student error:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
