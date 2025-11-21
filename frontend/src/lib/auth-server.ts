// Server-side authentication utilities
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_BASE_URL } from '@/lib/constants';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  mustChangePassword?: boolean;
}

export interface AuthResult {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

/**
 * Get current user from server-side
 * This function can be used in Server Components
 */
export async function getServerAuth(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    }

    // Verify token with backend
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    }

    const data = await response.json();

    return {
      user: data.user,
      token,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Server auth error:', error);
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    };
  }
}

/**
 * Require authentication for a page (Server Component)
 * Redirects to login if not authenticated
 */
export async function requireAuth(): Promise<AuthResult> {
  const auth = await getServerAuth();
  
  if (!auth.isAuthenticated) {
    redirect('/login');
  }

  return auth;
}

/**
 * Require admin role for a page (Server Component)
 * Redirects to dashboard if not admin
 */
export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireAuth();

  if (auth.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return auth;
}

/**
 * Redirect if already authenticated
 * Useful for login/register pages
 */
export async function redirectIfAuthenticated(to: string = '/dashboard'): Promise<void> {
  const auth = await getServerAuth();
  
  if (auth.isAuthenticated) {
    redirect(to);
  }
}
