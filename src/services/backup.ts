import fs from 'fs';
import path from 'path';
import { db } from '../lib/db';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DB_FILE = path.join(process.cwd(), 'prisma', 'dev.db');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Ensures required directories exist
 */
function ensureDirectories() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Formats file size in a human-readable form
 */
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Triggers a system database backup
 */
export async function createBackup(backupType: 'Auto' | 'Manual'): Promise<any> {
  ensureDirectories();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `sggs_backup_${backupType.toLowerCase()}_${timestamp}.db`;
  const destPath = path.join(BACKUP_DIR, backupFileName);

  try {
    // Check if SQLite db file exists
    if (!fs.existsSync(DB_FILE)) {
      throw new Error(`Source database file not found at ${DB_FILE}`);
    }

    // Copy DB file
    fs.copyFileSync(DB_FILE, destPath);

    const stats = fs.statSync(destPath);
    const sizeStr = formatBytes(stats.size);

    // Save to Database Backup logs
    const backupLog = await db.backup.create({
      data: {
        fileName: backupFileName,
        fileSize: sizeStr,
        backupType,
        status: 'Success',
      },
    });

    // Write a system log
    await db.auditLog.create({
      data: {
        action: 'Backup Created',
        details: `System backup (${backupType}) created successfully: ${backupFileName} (${sizeStr})`,
        ipAddress: '127.0.0.1',
        userAgent: 'System Service',
      },
    });

    return backupLog;
  } catch (error: any) {
    console.error('Backup creation failed:', error);
    
    // Log failure
    await db.backup.create({
      data: {
        fileName: backupFileName,
        fileSize: '0 Bytes',
        backupType,
        status: 'Failed',
      },
    });

    throw new Error(`Backup failed: ${error.message}`);
  }
}

/**
 * Restores the system database from a backup file
 */
export async function restoreBackup(fileName: string): Promise<boolean> {
  ensureDirectories();

  const backupFilePath = path.join(BACKUP_DIR, fileName);

  try {
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Backup file ${fileName} does not exist.`);
    }

    // Safely close connection before overwriting (Prisma disconnect)
    await db.$disconnect();

    // Overwrite dev.db with backup file
    fs.copyFileSync(backupFilePath, DB_FILE);

    // Re-establish connection / write audit log
    await db.$connect();

    await db.auditLog.create({
      data: {
        action: 'Backup Restored',
        details: `Database restored successfully from backup file: ${fileName}`,
        ipAddress: '127.0.0.1',
        userAgent: 'System Service',
      },
    });

    return true;
  } catch (error: any) {
    console.error('Backup restore failed:', error);
    
    // Try to reconnect if we disconnected
    try {
      await db.$connect();
    } catch {}

    throw new Error(`Restore failed: ${error.message}`);
  }
}

/**
 * Deletes a backup file
 */
export async function deleteBackupFile(id: string): Promise<boolean> {
  try {
    const backup = await db.backup.findUnique({ where: { id } });
    if (!backup) {
      throw new Error('Backup record not found.');
    }

    const filePath = path.join(BACKUP_DIR, backup.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await db.backup.delete({ where: { id } });
    return true;
  } catch (error: any) {
    throw new Error(`Deletion failed: ${error.message}`);
  }
}

/**
 * Lists all backup logs and file statuses
 */
export async function listBackups() {
  ensureDirectories();
  return db.backup.findMany({
    orderBy: { createdAt: 'desc' },
  });
}
