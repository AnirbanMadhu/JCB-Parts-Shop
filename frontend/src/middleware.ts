import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/change-password',
    '/change-password-otp',
  ];

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/reset-password')
  );

  // Get auth token from cookies
  const token = request.cookies.get('auth_token')?.value;

  // If accessing protected route without token, redirect to login
  if (!isPublicRoute && !token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // Note: We cannot check mustChangePassword here because the cookie doesn't contain it
  // The RouteGuard component on the client will handle the mustChangePassword redirect
  
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};
