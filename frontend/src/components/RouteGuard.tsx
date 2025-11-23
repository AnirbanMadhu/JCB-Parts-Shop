'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/change-password-otp',
  ];

  // Routes that authenticated users can access regardless of mustChangePassword
  const authAccessibleRoutes = [
    '/change-password',
  ];

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/reset-password')
  );

  const isAuthAccessibleRoute = authAccessibleRoutes.some(route => pathname === route);

  useEffect(() => {
    if (isLoading) return;

    const authenticated = isAuthenticated();

    // If user is not authenticated and trying to access protected route
    if (!authenticated && !isPublicRoute) {
      router.push('/login');
      return;
    }

    // If user is authenticated, check if they must change password
    if (authenticated && user) {
      // If user must change password and not already on change-password page
      if (user.mustChangePassword === true && pathname !== '/change-password') {
        console.log('[RouteGuard] User must change password, redirecting...');
        router.push('/change-password');
        return;
      }

      // If user doesn't need to change password and trying to access login/register
      if (!user.mustChangePassword && (pathname === '/login' || pathname === '/register')) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, isPublicRoute, user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const authenticated = isAuthenticated();

  // Don't render protected content if not authenticated
  if (!authenticated && !isPublicRoute) {
    return null;
  }

  // If authenticated and must change password, only allow change-password page
  if (authenticated && user?.mustChangePassword === true && pathname !== '/change-password') {
    return null;
  }

  // Don't render login/register if already authenticated (unless they must change password)
  if (authenticated && !user?.mustChangePassword && (pathname === '/login' || pathname === '/register')) {
    return null;
  }

  return <>{children}</>;
}
