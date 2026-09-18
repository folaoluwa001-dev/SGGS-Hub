import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, requireAuth } from '@/lib/auth';
import { juniorEntranceQuestions } from '@/lib/entranceExamQuestions';

// 1. GET: Fetch entrance exam questions
export async function GET(request: Request) {
  try {
    const session = await getSession();
    const isPrivileged = session && (session.role === 'TEACHER' || session.role === 'SUPER_ADMIN');

    // Check if questions exist in database
    let questions = await db.entranceQuestion.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // If no questions in DB yet, auto-seed with standard curriculum questions
    if (questions.length === 0) {
      for (const q of juniorEntranceQuestions) {
        await db.entranceQuestion.create({
          data: {
            subject: q.subject,
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            targetLevel: 'ALL',
          },
        });
      }

      questions = await db.entranceQuestion.findMany({
        orderBy: { createdAt: 'asc' },
      });
    }

    // Format response
    const formatted = questions.map((q) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch (e) {
        parsedOptions = [];
      }

      if (isPrivileged) {
        return {
          id: q.id,
          subject: q.subject,
          question: q.question,
          options: parsedOptions,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          targetLevel: q.targetLevel,
          createdAt: q.createdAt,
        };
      }

      // Public / student CBT exam mode: strip correct answer & explanation
      return {
        id: q.id,
        subject: q.subject,
        question: q.question,
        options: parsedOptions,
        targetLevel: q.targetLevel,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch entrance questions error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 2. POST: Create a new entrance question (Teachers & Admins)
export async function POST(request: Request) {
  try {
    await requireAuth(['TEACHER', 'SUPER_ADMIN']);
    const body = await request.json();

    const {
      subject,
      question,
      options,
      correctAnswer,
      explanation,
      targetLevel,
      action,
    } = body;

    // Reset/Re-seed action
    if (action === 'seed_defaults') {
      await db.entranceQuestion.deleteMany();
      for (const q of juniorEntranceQuestions) {
        await db.entranceQuestion.create({
          data: {
            subject: q.subject,
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            targetLevel: 'ALL',
          },
        });
      }
      return NextResponse.json({ success: true, message: 'Default entrance questions restored.' });
    }

    // Validation
    if (!subject?.trim() || !question?.trim()) {
      return NextResponse.json(
        { error: 'Subject and question text are required.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 question options are required.' },
        { status: 400 }
      );
    }

    const parsedCorrect = parseInt(correctAnswer, 10);
    if (isNaN(parsedCorrect) || parsedCorrect < 0 || parsedCorrect >= options.length) {
      return NextResponse.json(
        { error: 'Please select a valid correct answer index from the options.' },
        { status: 400 }
      );
    }

    const created = await db.entranceQuestion.create({
      data: {
        subject: subject.trim(),
        question: question.trim(),
        options: JSON.stringify(options.map((o: string) => o.trim())),
        correctAnswer: parsedCorrect,
        explanation: explanation?.trim() || null,
        targetLevel: targetLevel || 'ALL',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Question created successfully.',
        question: {
          ...created,
          options: JSON.parse(created.options),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create entrance question error:', error);
    const statusCode = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: statusCode });
  }
}
