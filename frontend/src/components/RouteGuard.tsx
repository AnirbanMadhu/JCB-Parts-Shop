'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/change-password-otp',
  ];

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/reset-password')
  );

  useEffect(() => {
    if (isLoading) return;

    const authenticated = isAuthenticated();

    // If user is not authenticated and trying to access protected route
    if (!authenticated && !isPublicRoute) {
      router.push('/login');
    }

    // If user is authenticated and trying to access login/register
    if (authenticated && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router, isPublicRoute]);

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

  // Don't render protected content if not authenticated
  if (!isAuthenticated() && !isPublicRoute) {
    return null;
  }

  // Don't render login/register if already authenticated
  if (isAuthenticated() && (pathname === '/login' || pathname === '/register')) {
    return null;
  }

  return <>{children}</>;
}
