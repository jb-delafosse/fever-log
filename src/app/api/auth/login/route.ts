import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  isAuthConfigured,
  createSessionToken,
  getSessionCookieConfig,
} from '@/lib/auth';

interface LoginRequest {
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if auth is configured
    if (!isAuthConfigured()) {
      return NextResponse.json(
        { error: 'Authentication not configured. Set AUTH_PASSWORD environment variable.' },
        { status: 503 }
      );
    }

    const body: LoginRequest = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create session token
    const token = createSessionToken();
    const cookieConfig = getSessionCookieConfig();

    // Create response with session cookie
    const response = NextResponse.json({ success: true });

    response.cookies.set(cookieConfig.name, token, {
      maxAge: cookieConfig.maxAge,
      httpOnly: cookieConfig.httpOnly,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: cookieConfig.path,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Check auth status
export async function GET() {
  return NextResponse.json({
    configured: isAuthConfigured(),
  });
}
