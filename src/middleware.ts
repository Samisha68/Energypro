// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for all API routes and static resources
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('robots.txt')
  ) {
    return NextResponse.next();
  }
  
  // Get token (authentication status)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Public paths that don't require authentication
  const publicPaths = ['/', '/auth'];
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Simple redirect logic without caching or loop detection
  const url = request.nextUrl.clone();
  
  // If on auth page and already authenticated, redirect to dashboard
  if (pathname === '/auth' && token) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  
  // If trying to access protected route without authentication
  if (!isPublicPath && !token) {
    url.pathname = '/auth';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Otherwise, proceed normally
  return NextResponse.next();
}

// Only run middleware on specific paths to reduce overhead
export const config = {
  matcher: ['/dashboard/:path*', '/auth']
};