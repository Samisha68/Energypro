// src/middleware.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value;

  // If accessing protected routes
  if (request.nextUrl.pathname.startsWith('/api/protected')) {
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      // Add user info to request headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('user', JSON.stringify(decoded));

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.log(error)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  }

  // If accessing auth pages while logged in
  if (token && (
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname === '/'
  )) {
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      // Token is invalid, let them access auth pages
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/protected/:path*',
    '/auth/:path*',
    '/'
  ]
};