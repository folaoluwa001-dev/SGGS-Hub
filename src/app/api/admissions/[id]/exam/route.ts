import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { score, answers, totalQuestions } = body;

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

    const calculatedScore = typeof score === 'number' ? Math.min(100, Math.max(0, score)) : 0;

    const updated = await db.application.update({
      where: { id: application.id },
      data: {
        examScore: calculatedScore,
        examStatus: 'completed',
        examMode: 'ONLINE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Entrance examination submitted and graded successfully.',
      score: calculatedScore,
      examStatus: 'completed',
      application: updated,
    });
  } catch (error: any) {
    console.error('Submit entrance exam error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
