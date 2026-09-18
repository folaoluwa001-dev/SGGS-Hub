import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// 1. PUT / PATCH: Edit question
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['TEACHER', 'SUPER_ADMIN']);
    const { id } = await context.params;
    const body = await request.json();

    const {
      subject,
      question,
      options,
      correctAnswer,
      explanation,
      targetLevel,
    } = body;

    const existing = await db.entranceQuestion.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (subject) updateData.subject = subject.trim();
    if (question) updateData.question = question.trim();
    if (Array.isArray(options)) {
      updateData.options = JSON.stringify(options.map((o: string) => o.trim()));
    }
    if (correctAnswer !== undefined) {
      const parsedCorrect = parseInt(correctAnswer, 10);
      if (!isNaN(parsedCorrect)) {
        updateData.correctAnswer = parsedCorrect;
      }
    }
    if (explanation !== undefined) {
      updateData.explanation = explanation ? explanation.trim() : null;
    }
    if (targetLevel) {
      updateData.targetLevel = targetLevel;
    }

    const updated = await db.entranceQuestion.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully.',
      question: {
        ...updated,
        options: JSON.parse(updated.options),
      },
    });
  } catch (error: any) {
    const statusCode = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: statusCode });
  }
}

// 2. DELETE: Remove question
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['TEACHER', 'SUPER_ADMIN']);
    const { id } = await context.params;

    const existing = await db.entranceQuestion.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    await db.entranceQuestion.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully.',
    });
  } catch (error: any) {
    const statusCode = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: statusCode });
  }
}
