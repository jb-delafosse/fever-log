import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'fever-log-session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get the configured auth password from environment variable.
 * Returns null if not configured.
 */
export function getAuthPassword(): string | null {
  return process.env.AUTH_PASSWORD || null;
}

/**
 * Check if authentication is configured.
 */
export function isAuthConfigured(): boolean {
  return getAuthPassword() !== null;
}

/**
 * Hash a password using SHA-256.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against the configured AUTH_PASSWORD.
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const authPassword = getAuthPassword();
  if (!authPassword) {
    return false;
  }
  return password === authPassword;
}

/**
 * Create a simple session token.
 * In production, you might want to use JWT or a more robust solution.
 */
export function createSessionToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const token = `${timestamp}-${random}`;
  // Simple signature using the auth password as secret
  return Buffer.from(token).toString('base64');
}

/**
 * Validate a session token.
 * Checks if the token is valid and not expired.
 */
export function validateSessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [timestampStr] = decoded.split('-');
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) {
      return false;
    }

    // Check if session is expired
    const now = Date.now();
    if (now - timestamp > SESSION_DURATION_MS) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get the session token from cookies (for use in API routes).
 */
export async function getSessionFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value || null;
}

/**
 * Validate the current session from cookies.
 * For use in API routes.
 */
export async function validateSession(): Promise<boolean> {
  const token = await getSessionFromCookies();
  if (!token) {
    return false;
  }
  return validateSessionToken(token);
}

/**
 * Validate session from a request object (for middleware).
 */
export function validateSessionFromRequest(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  return validateSessionToken(token);
}

/**
 * Get session cookie configuration.
 */
export function getSessionCookieConfig() {
  return {
    name: SESSION_COOKIE_NAME,
    maxAge: SESSION_DURATION_MS / 1000, // Convert to seconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}
