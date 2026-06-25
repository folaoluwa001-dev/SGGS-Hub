import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

/**
 * Generates a random alphanumeric token of a given length
 */
function generateRandomTokenCode(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// 1. GET: List all tokens and their usage analytics
export async function GET(request: Request) {
  try {
    await requireAuth(['SUPER_ADMIN']);

    const tokens = await db.token.findMany({
      include: {
        student: {
          include: {
            class: true,
          },
        },
        user: {
          select: {
            fullName: true,
          },
        },
        logs: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(tokens);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. POST: Generate tokens for a student or bulk-generate for an entire class
export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const body = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const { studentId, classId, quantity = 1 } = body;

    if (!studentId && !classId) {
      return NextResponse.json({ error: 'Either studentId or classId must be provided' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days expiration

    const generatedTokens = [];

    if (studentId) {
      // Generate specified number of tokens for a single student
      const student = await db.student.findUnique({ where: { id: studentId } });
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      for (let i = 0; i < quantity; i++) {
        let code = generateRandomTokenCode();
        // Avoid collisions
        let dupe = await db.token.findUnique({ where: { tokenString: code } });
        while (dupe) {
          code = generateRandomTokenCode();
          dupe = await db.token.findUnique({ where: { tokenString: code } });
        }

        const token = await db.token.create({
          data: {
            tokenString: code,
            studentId,
            expiresAt,
            generatedBy: sessionUser.userId,
            status: 'Active',
          },
        });
        generatedTokens.push(token);
      }

      await logAuditEvent(
        'Tokens Generated',
        `Generated ${quantity} tokens for Student ${student.fullName} (${studentId})`,
        sessionUser.userId,
        ip,
        userAgent
      );
    } else if (classId) {
      // Bulk generate: 1 token for each student in the selected class
      const students = await db.student.findMany({ where: { classId } });
      if (students.length === 0) {
        return NextResponse.json({ error: 'No students found in the selected class' }, { status: 400 });
      }

      for (const student of students) {
        let code = generateRandomTokenCode();
        let dupe = await db.token.findUnique({ where: { tokenString: code } });
        while (dupe) {
          code = generateRandomTokenCode();
          dupe = await db.token.findUnique({ where: { tokenString: code } });
        }

        const token = await db.token.create({
          data: {
            tokenString: code,
            studentId: student.id,
            expiresAt,
            generatedBy: sessionUser.userId,
            status: 'Active',
          },
        });
        generatedTokens.push(token);
      }

      await logAuditEvent(
        'Bulk Class Tokens Generated',
        `Generated bulk tokens (${students.length}) for all students in Class ID ${classId}`,
        sessionUser.userId,
        ip,
        userAgent
      );
    }

    return NextResponse.json({ success: true, count: generatedTokens.length, tokens: generatedTokens });
  } catch (error: any) {
    console.error('Token generation error:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
