/**
 * SWR configuration for optimized data fetching
 * Centralized API client with caching and revalidation
 */

import { SWRConfiguration } from 'swr';
import { API_BASE_URL } from '@/lib/constants';

/**
 * Custom fetcher with authentication, error handling, and auto-logout on 401
 */
export const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${url}`, { headers });
  } catch (networkError: any) {
    // Network errors (offline, DNS failure, timeout) — don't throw, return empty
    // SWR will retry automatically based on errorRetryCount
    const err = new Error(networkError.message || 'Network error');
    (err as any).status = 0;
    throw err;
  }
  
  if (!response.ok) {
    // Auto-clear auth on 401 — token expired or revoked
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Don't redirect here — let AuthContext handle it
    }
    
    const error = new Error('An error occurred while fetching the data.');
    const errorData = await response.json().catch(() => ({}));
    (error as any).info = errorData;
    (error as any).status = response.status;
    throw error;
  }
  
  return response.json();
};

/**
 * POST/PUT/DELETE fetcher with authentication and auto-logout on 401
 */
export const mutationFetcher = async (url: string, { arg }: { arg: { method: string; body?: any } }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${url}`, {
      method: arg.method,
      headers,
      body: arg.body ? JSON.stringify(arg.body) : undefined,
    });
  } catch (networkError: any) {
    const err = new Error(networkError.message || 'Network error during mutation');
    (err as any).status = 0;
    throw err;
  }
  
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    
    const error = new Error('An error occurred while mutating the data.');
    const errorData = await response.json().catch(() => ({}));
    (error as any).info = errorData;
    (error as any).status = response.status;
    throw error;
  }
  
  return response.json();
};

/**
 * Global SWR configuration
 */
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 5000,
  focusThrottleInterval: 10000,
  // No auto-polling by default; revalidate on focus/mutation only
  refreshInterval: 0,
  // Stop polling when tab is hidden or offline
  refreshWhenHidden: false,
  refreshWhenOffline: false,
  // Keep previous data while revalidating
  keepPreviousData: true,
  onError: (error, key) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`SWR Error for ${key}:`, error);
    }
  },
};

/**
 * Configuration for real-time data (faster revalidation)
 */
export const realtimeConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 60000, // Refresh every 60 seconds (was 5s - caused excessive load)
  dedupingInterval: 5000,
  refreshWhenHidden: false,
  refreshWhenOffline: false,
};

/**
 * Configuration for static data (slower revalidation)
 */
export const staticConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 300000, // Refresh every 5 minutes
  revalidateOnFocus: false,
};
