'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistAuth = (authUser: User, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(authUser));

    // Set cookie for middleware (7 days expiry)
    document.cookie = `auth_token=${authToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  };

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Verify token is still valid
      verifyToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const verifyToken = async (authToken: string): Promise<User | null> => {
    try {
      const response = await fetch(`/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        // Token is invalid, clear auth state
        logout();
      } else {
        const data: { user: User } = await response.json();
        // Preserve mustChangePassword flag from existing user data
        const existingUserData = localStorage.getItem('auth_user');
        let updatedUser = data.user;
        
        if (existingUserData) {
          const existingUser = JSON.parse(existingUserData);
          if (existingUser.mustChangePassword !== undefined) {
            updatedUser = { ...data.user, mustChangePassword: existingUser.mustChangePassword };
          }
        }
        
        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        return updatedUser;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }

    return null;
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: { user: User; token: string; error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      persistAuth(data.user, data.token);

      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<User> => {
    try {
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data: { user: User; token: string; error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      persistAuth(data.user, data.token);

      return data.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    // Clear cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      console.log('[AuthContext] User updated:', newUser);
    }
  };

  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };

  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    isAuthenticated,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
