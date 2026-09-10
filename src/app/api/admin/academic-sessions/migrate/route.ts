import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logAuditEvent } from '@/lib/auth';

const STANDARD_CLASSES = [
  { name: 'JSS1', level: 'JUNIOR' },
  { name: 'JSS2', level: 'JUNIOR' },
  { name: 'JSS3', level: 'JUNIOR' },
  { name: 'SSS1', level: 'SENIOR' },
  { name: 'SSS2', level: 'SENIOR' },
  { name: 'SSS3', level: 'SENIOR' },
];

const PROMOTION_ORDER = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'];

export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth(['SUPER_ADMIN']);
    const { sourceSessionId, targetSessionId, activateTargetSession } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    if (!sourceSessionId || !targetSessionId) {
      return NextResponse.json(
        { error: 'Both source session and target session are required for migration.' },
        { status: 400 }
      );
    }

    if (sourceSessionId === targetSessionId) {
      return NextResponse.json(
        { error: 'Source and target sessions cannot be identical.' },
        { status: 400 }
      );
    }

    // 1. Fetch Source and Target Sessions
    const sourceSession = await db.session.findUnique({ where: { id: sourceSessionId } });
    const targetSession = await db.session.findUnique({ where: { id: targetSessionId } });

    if (!sourceSession || !targetSession) {
      return NextResponse.json(
        { error: 'One or both specified academic sessions do not exist.' },
        { status: 404 }
      );
    }

    // 2. Ensure all standard classes exist (create if not present)
    const classMap: Record<string, any> = {};
    for (const stdCls of STANDARD_CLASSES) {
      let cls = await db.class.findUnique({ where: { name: stdCls.name } });
      if (!cls) {
        cls = await db.class.create({
          data: { name: stdCls.name, level: stdCls.level },
        });
      }
      classMap[stdCls.name] = cls;
    }

    // 3. Ensure the Graduating Students category exists for source session
    // e.g. "Graduating Students of 2026/2027"
    const graduatingClassName = `Graduating Students of ${sourceSession.name}`;
    let graduatingClass = await db.class.findUnique({
      where: { name: graduatingClassName },
    });

    if (!graduatingClass) {
      graduatingClass = await db.class.create({
        data: {
          name: graduatingClassName,
          level: 'GRADUATED',
        },
      });
    }

    // 4. Fetch students in source session who are currently in standard classes
    const eligibleStudents = await db.student.findMany({
      where: {
        sessionId: sourceSession.id,
        class: {
          name: { in: PROMOTION_ORDER },
        },
      },
      include: {
        class: true,
      },
    });

    const breakdown: Record<string, { from: string; to: string; count: number; studentIds: string[] }> = {
      JSS1: { from: 'JSS1', to: 'JSS2', count: 0, studentIds: [] },
      JSS2: { from: 'JSS2', to: 'JSS3', count: 0, studentIds: [] },
      JSS3: { from: 'JSS3', to: 'SSS1', count: 0, studentIds: [] },
      SSS1: { from: 'SSS1', to: 'SSS2', count: 0, studentIds: [] },
      SSS2: { from: 'SSS2', to: 'SSS3', count: 0, studentIds: [] },
      SSS3: { from: 'SSS3', to: graduatingClassName, count: 0, studentIds: [] },
    };

    for (const student of eligibleStudents) {
      const clsName = student.class.name;
      if (breakdown[clsName]) {
        breakdown[clsName].count++;
        breakdown[clsName].studentIds.push(student.id);
      }
    }

    // 5. Execute Migration in a Database Transaction
    await db.$transaction(async (tx) => {
      // (a) Promote JSS1 -> JSS2
      if (breakdown.JSS1.studentIds.length > 0) {
        await tx.student.updateMany({
          where: { id: { in: breakdown.JSS1.studentIds } },
          data: {
            classId: classMap.JSS2.id,
            sessionId: targetSession.id,
          },
        });
      }

      // (b) Promote JSS2 -> JSS3
      if (breakdown.JSS2.studentIds.length > 0) {
        await tx.student.updateMany({
          where: { id: { in: breakdown.JSS2.studentIds } },
          data: {
            classId: classMap.JSS3.id,
            sessionId: targetSession.id,
          },
        });
      }

      // (c) Promote JSS3 -> SSS1
      if (breakdown.JSS3.studentIds.length > 0) {
        await tx.student.updateMany({
          where: { id: { in: breakdown.JSS3.studentIds } },
          data: {
            classId: classMap.SSS1.id,
            sessionId: targetSession.id,
          },
        });
      }

      // (d) Promote SSS1 -> SSS2
      if (breakdown.SSS1.studentIds.length > 0) {
        await tx.student.updateMany({
          where: { id: { in: breakdown.SSS1.studentIds } },
          data: {
            classId: classMap.SSS2.id,
            sessionId: targetSession.id,
          },
        });
      }

      // (e) Promote SSS2 -> SSS3
      if (breakdown.SSS2.studentIds.length > 0) {
        await tx.student.updateMany({
          where: { id: { in: breakdown.SSS2.studentIds } },
          data: {
            classId: classMap.SSS3.id,
            sessionId: targetSession.id,
          },
        });
      }

      // (f) Graduate SSS3 -> "Graduating Class of <SourceSessionName>"
      if (breakdown.SSS3.studentIds.length > 0) {
        await tx.student.updateMany({
          where: { id: { in: breakdown.SSS3.studentIds } },
          data: {
            classId: graduatingClass.id,
            // Keep sourceSessionId so their graduation record retains the year they finished
            sessionId: sourceSession.id,
          },
        });
      }

      // (g) Optionally activate target session
      if (activateTargetSession) {
        await tx.session.updateMany({ data: { active: false } });
        await tx.session.update({
          where: { id: targetSession.id },
          data: { active: true },
        });
        await tx.settings.upsert({
          where: { key: 'current_session_id' },
          update: { value: targetSession.id },
          create: { key: 'current_session_id', value: targetSession.id },
        });
      }
    });

    const totalPromoted =
      breakdown.JSS1.count +
      breakdown.JSS2.count +
      breakdown.JSS3.count +
      breakdown.SSS1.count +
      breakdown.SSS2.count;
    const totalGraduated = breakdown.SSS3.count;
    const totalMigrated = totalPromoted + totalGraduated;

    // 6. Audit Trail Logging
    await logAuditEvent(
      'Session Migration Executed',
      `Student directory migrated from ${sourceSession.name} to ${targetSession.name}. Promoted: ${totalPromoted}, Graduated into '${graduatingClassName}': ${totalGraduated}`,
      sessionUser.userId,
      ip,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully. ${totalPromoted} students promoted and ${totalGraduated} students graduated.`,
      sourceSession: { id: sourceSession.id, name: sourceSession.name },
      targetSession: { id: targetSession.id, name: targetSession.name },
      graduatingClass: { id: graduatingClass.id, name: graduatingClass.name },
      totalMigrated,
      totalPromoted,
      totalGraduated,
      breakdown: Object.values(breakdown).map((b) => ({
        from: b.from,
        to: b.to,
        count: b.count,
      })),
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
