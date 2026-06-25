import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { generatePaymentReceiptPDF } from '@/services/pdf';

export async function GET(request: Request) {
  try {
    // Authenticate (Admin and Bursar can print receipts)
    const session = await requireAuth(['SUPER_ADMIN', 'BURSAR']);

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        recordedByUser: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    // Format date nicely
    const formattedDate = payment.paymentDate.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Format payment info for PDF generator
    const receiptData = {
      receiptNumber: payment.receiptNumber,
      studentName: payment.student.fullName,
      studentId: payment.student.id,
      class: payment.student.class.name,
      category: payment.category,
      amountPaid: payment.amountPaid,
      totalExpected: payment.totalExpected,
      balance: payment.balance,
      paymentDate: formattedDate,
      recordedBy: payment.recordedByUser.fullName,
    };

    const pdfBuffer = await generatePaymentReceiptPDF(receiptData);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="sggs_receipt_${payment.receiptNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Receipt PDF generation error:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
