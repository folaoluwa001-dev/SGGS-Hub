import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createBackup, listBackups, restoreBackup, deleteBackupFile } from '@/services/backup';

// 1. GET: Fetch list of backup logs
export async function GET() {
  try {
    await requireAuth(['SUPER_ADMIN']);
    const backups = await listBackups();
    return NextResponse.json(backups);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 2. POST: Trigger a manual backup
export async function POST() {
  try {
    await requireAuth(['SUPER_ADMIN']);
    const backupLog = await createBackup('Manual');
    return NextResponse.json({ success: true, backup: backupLog });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 3. PUT: Restore from a backup file
export async function PUT(request: Request) {
  try {
    await requireAuth(['SUPER_ADMIN']);
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required for restore' }, { status: 400 });
    }

    const success = await restoreBackup(fileName);
    return NextResponse.json({ success });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

// 4. DELETE: Remove a backup record and file
export async function DELETE(request: Request) {
  try {
    await requireAuth(['SUPER_ADMIN']);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
    }

    const success = await deleteBackupFile(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
