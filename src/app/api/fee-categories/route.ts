import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

const REQUIRED_CATEGORIES = [
  'Tuition Lecture Fee',
  'Uniforms Levy',
  'Books & Materials',
  'Assessments & Exams',
  'Other Admin Charges',
];

// 1. GET: Fetch all classes with their fee category structures
export async function GET(request: Request) {
  try {
    await requireAuth(['SUPER_ADMIN', 'BURSAR']);

    const classes = await db.class.findMany({
      orderBy: { name: 'asc' },
      include: {
        feeCategories: true,
      },
    });

    // Format to ensure all 5 required categories exist for display
    const formattedClasses = classes.map((cls) => {
      const categoriesMap = new Map(cls.feeCategories.map((c) => [c.name, c.defaultAmount]));
      const feeCategories = REQUIRED_CATEGORIES.map((name) => ({
        name,
        defaultAmount: categoriesMap.get(name) ?? 0,
      }));

      return {
        id: cls.id,
        name: cls.name,
        level: cls.level,
        feeCategories,
      };
    });

    return NextResponse.json(formattedClasses);
  } catch (error: any) {
    console.error('Fetch fee configs error:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. POST: Bulk update fee configurations and propagate to students
export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN', 'BURSAR']);
    const body = await request.json();
    const { updates } = body; // Array of { classId, name, amount }

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates format' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Update in transaction to preserve database integrity
    await db.$transaction(async (tx) => {
      // Fetch all current fee categories from the DB first to check for changes
      const currentConfigs = await tx.feeCategory.findMany();
      const configMap = new Map(currentConfigs.map(c => [`${c.classId}_${c.name}`, c.defaultAmount]));

      for (const update of updates) {
        const { classId, name, amount } = update;
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount < 0) {
          throw new Error(`Invalid fee amount for ${name} in class ID ${classId}`);
        }

        const existingAmount = configMap.get(`${classId}_${name}`);
        if (existingAmount === numericAmount) {
          // No change, skip database operations for this category-class combination
          continue;
        }

        // Upsert default amount in FeeCategory
        await tx.feeCategory.upsert({
          where: {
            name_classId: {
              name,
              classId,
            },
          },
          update: {
            defaultAmount: numericAmount,
          },
          create: {
            classId,
            name,
            defaultAmount: numericAmount,
          },
        });

        // Fetch all existing payments for this class and category in bulk
        const existingPayments = await tx.payment.findMany({
          where: {
            category: name,
            student: { classId },
          },
        });

        // Update existing payments
        for (const payment of existingPayments) {
          const newBalance = Math.max(0, numericAmount - payment.amountPaid);
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              totalExpected: numericAmount,
              balance: newBalance,
            },
          });
        }

        // Find students in this class who don't have this payment category yet
        const existingPaymentStudentIds = new Set(existingPayments.map((p) => p.studentId));
        const classStudents = await tx.student.findMany({
          where: { classId },
          select: { id: true },
        });

        const missingStudents = classStudents.filter((s) => !existingPaymentStudentIds.has(s.id));

        if (missingStudents.length > 0) {
          const newPaymentsData = missingStudents.map((student) => ({
            studentId: student.id,
            amountPaid: 0,
            totalExpected: numericAmount,
            balance: numericAmount,
            category: name,
            receiptNumber: `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            recordedBy: sessionUser.userId,
          }));

          await tx.payment.createMany({
            data: newPaymentsData,
          });
        }
      }
    }, {
      timeout: 30000 // 30 seconds timeout to prevent transient network issues from closing transaction
    });

    await logAuditEvent(
      'Fee Config Updated',
      `School fee structures were updated by Bursar/Admin.`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update fee configs error:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
