import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

// 1. GET: Fetch a single student's details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin, Teacher, and Bursar can view student details
    await requireAuth(['SUPER_ADMIN', 'TEACHER', 'BURSAR']);
    const { id } = await params;

    const student = await db.student.findUnique({
      where: { id },
      include: {
        class: true,
        session: true,
        results: {
          include: {
            subject: true,
            term: true,
            session: true,
          },
        },
        payments: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. PUT: Update student details
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const { id } = await params;
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

    // Check if student exists
    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if admission number is being changed and is already taken
    if (admissionNumber && admissionNumber !== existing.admissionNumber) {
      const dupe = await db.student.findUnique({ where: { admissionNumber } });
      if (dupe) {
        return NextResponse.json({ error: `Admission number ${admissionNumber} is already taken.` }, { status: 400 });
      }
    }

    const updated = await db.student.update({
      where: { id },
      data: {
        admissionNumber: admissionNumber ?? existing.admissionNumber,
        fullName: fullName ?? existing.fullName,
        gender: gender ?? existing.gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existing.dateOfBirth,
        address: address ?? existing.address,
        parentName: parentName ?? existing.parentName,
        parentPhone: parentPhone ?? existing.parentPhone,
        parentEmail: parentEmail ?? existing.parentEmail,
        classId: classId ?? existing.classId,
        sessionId: sessionId ?? existing.sessionId,
        passportPhotograph: passportPhotograph ?? existing.passportPhotograph,
      },
      include: {
        class: true,
        session: true,
      },
    });

    await logAuditEvent(
      'Student Updated',
      `Student ${updated.fullName} (${id}) was updated by Admin.`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update student error:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 3. DELETE: Remove a student
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const { id } = await params;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const student = await db.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Delete student (Cascade deletes results, payments, tokens because of Prisma schema settings)
    await db.student.delete({ where: { id } });

    await logAuditEvent(
      'Student Deleted',
      `Student ${student.fullName} (${id}) was permanently deleted.`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
