import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth actions, the login page, and Next.js internals to pass through
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Get and check the recruiter session cookie
  const token = request.cookies.get('recruiter_auth')?.value;
  const isAuthorized = await verifySessionToken(token);

  if (!isAuthorized) {
    // For API requests, return a JSON response
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }
    // For page requests, redirect to login page
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Guard all routes except static resource directories
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
