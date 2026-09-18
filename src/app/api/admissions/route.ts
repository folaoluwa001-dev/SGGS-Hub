import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

// E.164 phone number validator: e.g. +2348012345678
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * Generate unique admission reference number, e.g., ADM-2026-0042
 */
async function generateReferenceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ADM-${year}-`;
  
  const lastApp = await db.application.findFirst({
    where: { referenceNumber: { startsWith: prefix } },
    orderBy: { referenceNumber: 'desc' },
  });

  let nextNum = 1;
  if (lastApp && lastApp.referenceNumber.startsWith(prefix)) {
    const lastPart = lastApp.referenceNumber.substring(prefix.length);
    const parsed = parseInt(lastPart, 10);
    if (!isNaN(parsed)) {
      nextNum = parsed + 1;
    }
  }

  // Also verify against collisions
  let ref = `${prefix}${String(nextNum).padStart(4, '0')}`;
  let exists = await db.application.findUnique({ where: { referenceNumber: ref } });
  while (exists) {
    nextNum += 1;
    ref = `${prefix}${String(nextNum).padStart(4, '0')}`;
    exists = await db.application.findUnique({ where: { referenceNumber: ref } });
  }

  return ref;
}

// 1. GET: Fetch list of applications (Admin only)
export async function GET(request: Request) {
  try {
    await requireAuth(['SUPER_ADMIN']);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const className = searchParams.get('class') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: 'insensitive' } },
        { parentName: { contains: search, mode: 'insensitive' } },
        { parentPhone: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { assignedStudentId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (className && className !== 'all') {
      where.OR = [
        { targetClass: className },
        { assignedClass: className },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // End of that date
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const applications = await db.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(applications);
  } catch (error: any) {
    const statusCode = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: statusCode });
  }
}

// 2. POST: Submit a new application (Public)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      student_name,
      dob,
      gender,
      target_class,
      parent_name,
      parent_phone,
      parent_whatsapp,
      residential_address,
      previous_school,
      exam_mode,
      exam_date,
    } = body;

    // Required fields validation
    if (
      !student_name?.trim() ||
      !dob ||
      !gender ||
      !target_class?.trim() ||
      !parent_name?.trim() ||
      !parent_phone?.trim() ||
      !residential_address?.trim()
    ) {
      return NextResponse.json(
        { error: 'Please fill in all required fields: Student Name, Date of Birth, Gender, Target Class, Parent Name, Parent Phone, and Residential Address.' },
        { status: 400 }
      );
    }

    // Gender validation
    if (gender !== 'Male' && gender !== 'Female') {
      return NextResponse.json({ error: 'Gender must be either Male or Female.' }, { status: 400 });
    }

    // E.164 phone validation
    const cleanedPhone = parent_phone.trim().replace(/[\s-]/g, '');
    if (!E164_REGEX.test(cleanedPhone)) {
      return NextResponse.json(
        { error: 'Parent phone number must be in valid E.164 format (e.g. +2348012345678).' },
        { status: 400 }
      );
    }

    let cleanedWhatsapp: string | null = null;
    if (parent_whatsapp && typeof parent_whatsapp === 'string' && parent_whatsapp.trim()) {
      const trimmedWhatsapp = parent_whatsapp.trim().replace(/[\s-]/g, '');
      if (!E164_REGEX.test(trimmedWhatsapp)) {
        return NextResponse.json(
          { error: 'Parent WhatsApp number must be in valid E.164 format (e.g. +2348012345678).' },
          { status: 400 }
        );
      }
      cleanedWhatsapp = trimmedWhatsapp;
    }

    // Parse DOB
    const parsedDob = new Date(dob);
    if (isNaN(parsedDob.getTime())) {
      return NextResponse.json({ error: 'Invalid Date of Birth.' }, { status: 400 });
    }

    // Parse Exam Date if provided
    let parsedExamDate: Date | null = null;
    if (exam_date) {
      const d = new Date(exam_date);
      if (!isNaN(d.getTime())) {
        parsedExamDate = d;
      }
    }

    const referenceNumber = await generateReferenceNumber();

    const application = await db.application.create({
      data: {
        referenceNumber,
        studentName: student_name.trim(),
        dob: parsedDob,
        gender,
        targetClass: target_class.trim(),
        parentName: parent_name.trim(),
        parentPhone: cleanedPhone,
        parentWhatsapp: cleanedWhatsapp,
        residentialAddress: residential_address.trim(),
        previousSchool: previous_school?.trim() || null,
        status: 'pending',
        assignedClass: target_class.trim(),
        examMode: exam_mode === 'PHYSICAL' ? 'PHYSICAL' : 'ONLINE',
        examDate: parsedExamDate,
        examStatus: exam_mode === 'PHYSICAL' ? 'scheduled' : 'pending',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully.',
        application,
        referenceNumber,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit application. Please try again.' },
      { status: 500 }
    );
  }
}
