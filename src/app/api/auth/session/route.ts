import { NextResponse } from 'next/server';
import { validateSession, isAuthConfigured } from '@/lib/auth';

export async function GET() {
  const configured = isAuthConfigured();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      authenticated: false,
    });
  }

  const authenticated = await validateSession();

  return NextResponse.json({
    configured: true,
    authenticated,
  });
}
