import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

// 1. GET: Fetch payments (payment reports and debtors list)
export async function GET(request: Request) {
  try {
    // Requires Admin or Bursar authorization
    await requireAuth(['SUPER_ADMIN', 'BURSAR']);

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || '';
    const classId = searchParams.get('classId') || '';
    const category = searchParams.get('category') || '';
    const isDebtor = searchParams.get('isDebtor') === 'true'; // Filter for outstanding balance > 0

    const whereClause: any = {};

    if (studentId) {
      whereClause.studentId = studentId;
    }

    if (category) {
      whereClause.category = category;
    }

    if (isDebtor) {
      whereClause.balance = { gt: 0 };
    }

    if (classId) {
      whereClause.student = { classId };
    }

    const payments = await db.payment.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. POST: Record a manual fee payment
export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN', 'BURSAR']);
    const body = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const { studentId, amountPaid, category } = body;

    if (!studentId || amountPaid === undefined || !category) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const paymentAmount = parseFloat(amountPaid);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Amount paid must be a positive number' }, { status: 400 });
    }

    // Find the outstanding payment fee record for this student and category
    // New students have default fee category records created on student creation.
    const feeRecord = await db.payment.findFirst({
      where: {
        studentId,
        category,
      },
    });

    let updatedRecord;
    const receiptNum = `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (feeRecord) {
      // Add amount to paid amount and reduce outstanding balance
      const newPaid = feeRecord.amountPaid + paymentAmount;
      const newBalance = Math.max(0, feeRecord.totalExpected - newPaid);

      updatedRecord = await db.payment.update({
        where: { id: feeRecord.id },
        data: {
          amountPaid: newPaid,
          balance: newBalance,
          receiptNumber: receiptNum, // Overwrite with latest transaction receipt
          paymentDate: new Date(),
          recordedBy: sessionUser.userId,
        },
        include: {
          student: true,
        },
      });
    } else {
      // Fallback: If no preset record, create a new one
      const totalExpected = paymentAmount; // Assume fully paid for unexpected fees
      updatedRecord = await db.payment.create({
        data: {
          studentId,
          amountPaid: paymentAmount,
          totalExpected,
          balance: 0,
          category,
          receiptNumber: receiptNum,
          recordedBy: sessionUser.userId,
        },
        include: {
          student: true,
        },
      });
    }

    await logAuditEvent(
      'Payment Logged',
      `Payment of NGN ${paymentAmount.toLocaleString()} recorded for Student ${updatedRecord.student.fullName} (${studentId}) in Category ${category}. Receipt: ${receiptNum}`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json(updatedRecord, { status: 201 });
  } catch (error: any) {
    console.error('Record payment error:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
