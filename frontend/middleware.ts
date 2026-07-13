import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware — equivalent of ProtectedRoute + AdminRoute components in React Router.
 * Runs on the server before any protected page is rendered.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
    ?? request.headers.get('authorization')?.replace('Bearer ', '');

  const { pathname } = request.nextUrl;

  // Public paths — always allow
  const publicPaths = ['/login', '/unauthorized', '/api'];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // No token → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
