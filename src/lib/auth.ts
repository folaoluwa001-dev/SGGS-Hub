import { cookies } from 'next/headers';
import { verifyAccessToken, TokenPayload } from './jwt';
import { db } from './db';

/**
 * Retrieves the current authenticated user session from HTTP-only cookies
 */
export async function getSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return null;

    const payload = verifyAccessToken(token);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Validates session and checks role permission boundaries.
 * Throws an error if validation fails.
 */
export async function requireAuth(allowedRoles?: string[]): Promise<TokenPayload> {
  const session = await getSession();
  
  if (!session) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    const err: any = new Error('Forbidden: Insufficient privileges');
    err.status = 403;
    throw err;
  }

  return session;
}

/**
 * Creates an audit log entry in the database
 */
export async function logAuditEvent(
  action: string, 
  details: string, 
  userId?: string | null,
  ipAddress: string = '127.0.0.1',
  userAgent: string = 'Mozilla/5.0'
) {
  try {
    await db.auditLog.create({
      data: {
        action,
        details,
        userId: userId || null,
        ipAddress,
        userAgent,
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
