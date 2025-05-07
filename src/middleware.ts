// middleware.ts
import { authMiddleware } from '@civic/auth/nextjs/middleware'
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Chain the Civic Auth middleware with our custom middleware
const withCivicAuth = authMiddleware();

export async function middleware(request: NextRequest) {
  // First, let Civic Auth middleware handle the request
  const civicResponse = await withCivicAuth(request);
  
  // If Civic Auth middleware returns a response, use it
  if (civicResponse) {
    return civicResponse;
  }
  
  // Otherwise, continue with our custom middleware logic
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
  
  // Public paths that don't require authentication
  const publicPaths = ['/', '/auth', '/auth/callback'];
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Simple redirect logic without caching or loop detection
  const url = request.nextUrl.clone();
  
  // If trying to access protected route without authentication
  if (!isPublicPath) {
    url.pathname = '/auth';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Otherwise, proceed normally
  return NextResponse.next();
}

export default authMiddleware();

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next directory (Next.js static files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - image files
     * - public files
     * - auth routes
     */
    '/((?!_next|favicon.ico|sitemap.xml|robots.txt|.*\.jpg|.*\.png|.*\.svg|.*\.gif|api/auth|auth).*)',
  ],
};