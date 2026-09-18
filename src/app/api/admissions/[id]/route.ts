import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

// 1. GET: Fetch a single application by ID or Reference Number
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const application = await db.application.findFirst({
      where: {
        OR: [
          { id },
          { referenceNumber: id },
        ],
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 2. PATCH: Update status and handle Student Directory Sync upon admission
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(['SUPER_ADMIN']);
    const { id } = await context.params;
    const body = await request.json();

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Locate application
    const application = await db.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const {
      status,
      assigned_student_id,
      assigned_class,
      exam_date,
      exam_score,
      exam_status,
    } = body;

    const updateData: any = {};

    if (exam_date !== undefined) {
      updateData.examDate = exam_date ? new Date(exam_date) : null;
    }
    if (exam_score !== undefined) {
      updateData.examScore = exam_score !== null ? parseFloat(exam_score) : null;
    }
    if (exam_status !== undefined) {
      updateData.examStatus = exam_status;
    }

    // Status change handling
    if (status) {
      if (!['pending', 'admitted', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }

      if (status === 'admitted') {
        const studentIdToAssign = (assigned_student_id || application.assignedStudentId || '').trim();
        const classToAssign = (assigned_class || application.assignedClass || application.targetClass || '').trim();

        if (!studentIdToAssign) {
          return NextResponse.json(
            { error: 'An official Assigned Student ID is required when admitting an applicant.' },
            { status: 400 }
          );
        }

        if (!classToAssign) {
          return NextResponse.json(
            { error: 'An assigned class must be confirmed when admitting an applicant.' },
            { status: 400 }
          );
        }

        // Verify assigned_student_id is not already taken by another application
        const existingAppWithId = await db.application.findFirst({
          where: {
            assignedStudentId: studentIdToAssign,
            NOT: { id: application.id },
          },
        });
        if (existingAppWithId) {
          return NextResponse.json(
            { error: `Student ID "${studentIdToAssign}" is already assigned to application ${existingAppWithId.referenceNumber}.` },
            { status: 400 }
          );
        }

        // Find matching Class
        let matchedClass = await db.class.findFirst({
          where: {
            name: { equals: classToAssign, mode: 'insensitive' },
          },
        });

        if (!matchedClass) {
          // If class not found exactly, find by contains or fallback to first available
          matchedClass = await db.class.findFirst({
            where: {
              name: { contains: classToAssign, mode: 'insensitive' },
            },
          });
        }

        if (!matchedClass) {
          // Fallback: create class or pick first existing
          const firstClass = await db.class.findFirst();
          if (!firstClass) {
            matchedClass = await db.class.create({
              data: {
                name: classToAssign,
                level: classToAssign.toLowerCase().startsWith('sss') ? 'SENIOR' : 'JUNIOR',
              },
            });
          } else {
            matchedClass = firstClass;
          }
        }

        // Find active session
        let activeSession = await db.session.findFirst({
          where: { active: true },
        });

        if (!activeSession) {
          activeSession = await db.session.findFirst({
            orderBy: { name: 'desc' },
          });
        }

        if (!activeSession) {
          const currentYear = new Date().getFullYear();
          activeSession = await db.session.create({
            data: {
              name: `${currentYear}/${currentYear + 1}`,
              active: true,
            },
          });
        }

        // ==========================================
        // STUDENT DIRECTORY SYNC (Atomic Upsert)
        // ==========================================
        const studentEmail = `${studentIdToAssign.toLowerCase().replace(/[^a-z0-9]/g, '')}@parents.sggs.edu.ng`;

        const syncedStudent = await db.student.upsert({
          where: { id: studentIdToAssign },
          update: {
            admissionNumber: studentIdToAssign,
            fullName: application.studentName,
            gender: application.gender,
            dateOfBirth: application.dob,
            address: application.residentialAddress,
            parentName: application.parentName,
            parentPhone: application.parentPhone,
            classId: matchedClass.id,
            sessionId: activeSession.id,
          },
          create: {
            id: studentIdToAssign,
            admissionNumber: studentIdToAssign,
            fullName: application.studentName,
            gender: application.gender,
            dateOfBirth: application.dob,
            address: application.residentialAddress,
            parentName: application.parentName,
            parentPhone: application.parentPhone,
            parentEmail: studentEmail,
            classId: matchedClass.id,
            sessionId: activeSession.id,
          },
        });

        // Initialize Fee Category records if they don't already exist for this student
        const feeCategories = await db.feeCategory.findMany({
          where: { classId: matchedClass.id },
        });

        for (const category of feeCategories) {
          const existingPayment = await db.payment.findFirst({
            where: {
              studentId: syncedStudent.id,
              category: category.name,
            },
          });

          if (!existingPayment) {
            const receiptNum = `REC-ADM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
            await db.payment.create({
              data: {
                studentId: syncedStudent.id,
                amountPaid: 0,
                totalExpected: category.defaultAmount,
                balance: category.defaultAmount,
                category: category.name,
                receiptNumber: receiptNum,
                recordedBy: session.userId,
                description: `Initial fee allocation upon admission (${matchedClass.name})`,
              },
            });
          }
        }

        updateData.status = 'admitted';
        updateData.assignedStudentId = studentIdToAssign;
        updateData.assignedClass = matchedClass.name;

        await logAuditEvent(
          'Student Admitted',
          `Applicant ${application.studentName} (${application.referenceNumber}) admitted as Student ID ${studentIdToAssign} into ${matchedClass.name}`,
          session.userId,
          ip,
          userAgent
        );
      } else {
        updateData.status = status;
        if (assigned_class) updateData.assignedClass = assigned_class;
        if (assigned_student_id) updateData.assignedStudentId = assigned_student_id;

        await logAuditEvent(
          `Application Status Updated: ${status}`,
          `Application ${application.referenceNumber} for ${application.studentName} set to ${status}`,
          session.userId,
          ip,
          userAgent
        );
      }
    }

    const updatedApplication = await db.application.update({
      where: { id: application.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Application updated successfully${updateData.status === 'admitted' ? ' and synced with Student Directory.' : '.'}`,
      application: updatedApplication,
    });
  } catch (error: any) {
    console.error('Update application error:', error);
    const statusCode = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: statusCode });
  }
}
