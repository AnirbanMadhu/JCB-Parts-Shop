'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMandatory, setIsMandatory] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // Check if password change is mandatory
    const userData = localStorage.getItem('auth_user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      const mustChange = parsedUser.mustChangePassword === true;
      console.log('Change password page - User data:', parsedUser);
      console.log('Must change password:', mustChange);
      setIsMandatory(mustChange);
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!isMandatory && !currentPassword) {
      setError('Current password is required');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setIsLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      
      console.log('Changing password...');
      console.log('API URL:', API_URL);
      console.log('Is mandatory:', isMandatory);
      console.log('Request body:', { 
        hasCurrentPassword: !!currentPassword, 
        hasNewPassword: !!newPassword 
      });

      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(isMandatory ? {} : { currentPassword }),
          newPassword,
        }),
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      console.log('Password changed successfully!');
      
      // Update user data to remove mustChangePassword flag
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        parsedUser.mustChangePassword = false;
        localStorage.setItem('auth_user', JSON.stringify(parsedUser));
        console.log('Updated user data in localStorage:', parsedUser);
      }

      setIsSuccess(true);

      // Immediate redirect after successful password change
      console.log('Redirecting to dashboard...');
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isMandatory) {
      // If mandatory, logout and return to login
      logout();
      router.push('/login');
    } else {
      // If optional, return to previous page
      router.back();
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
              Password changed successfully
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              JCB Parts Shop Management System
            </p>
          </div>
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-500">
                  Your password has been changed successfully!
                </h3>
                <div className="mt-2 text-sm text-green-500/80">
                  <p>You can now use your new password to login.</p>
                  <p className="mt-2">Redirecting to dashboard...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
            {isMandatory ? '🔒 Change Your Password' : 'Change Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {isMandatory
              ? 'For security purposes, you must change your password before continuing'
              : 'Update your account password'}
          </p>
        </div>

        {isMandatory && (
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-500">
                  Password Change Required
                </h3>
                <div className="mt-2 text-sm text-yellow-500/80">
                  <p>
                    This is your first login with a temporary password. Please create a new
                    password to secure your account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 shadow-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-500">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {!isMandatory && (
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-foreground mb-1">
                  Current Password
                </label>
                <input
                  id="current-password"
                  name="current-password"
                  type="password"
                  autoComplete="current-password"
                  required={!isMandatory}
                  className="appearance-none relative block w-full px-3 py-2 border border-input bg-background placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors sm:text-sm shadow-sm"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-1">
                New Password
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-input bg-background placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors sm:text-sm shadow-sm"
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-1">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-input bg-background placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors sm:text-sm shadow-sm"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {isLoading ? 'Changing password...' : '✓ Change Password'}
            </button>
            {!isMandatory && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 flex justify-center py-2 px-4 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all shadow-sm"
              >
                Cancel
              </button>
            )}
          </div>

          {!isMandatory && (
            <div className="text-center">
              <Link href="/change-password-otp" className="text-sm text-primary hover:text-primary/80 transition-colors">
                Don&apos;t remember current password? Use email verification
              </Link>
            </div>
          )}

          {isMandatory && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleCancel}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Logout and return to login
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
