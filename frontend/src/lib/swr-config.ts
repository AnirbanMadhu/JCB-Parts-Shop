/**
 * SWR configuration for optimized data fetching
 * Centralized API client with caching and revalidation
 */

import { SWRConfiguration } from 'swr';
import { API_BASE_URL } from '@/lib/constants';

/**
 * Custom fetcher with authentication and error handling
 */
export const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, { headers });
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    const errorData = await response.json().catch(() => ({}));
    (error as any).info = errorData;
    (error as any).status = response.status;
    throw error;
  }
  
  return response.json();
};

/**
 * POST/PUT/DELETE fetcher with authentication
 */
export const mutationFetcher = async (url: string, { arg }: { arg: { method: string; body?: any } }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: arg.method,
    headers,
    body: arg.body ? JSON.stringify(arg.body) : undefined,
  });
  
  if (!response.ok) {
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
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,
  // Keep data fresh by revalidating every 30 seconds for critical data
  refreshInterval: 30000,
  // Keep previous data while revalidating
  keepPreviousData: true,
  onError: (error, key) => {
    console.error(`SWR Error for ${key}:`, error);
  },
};

/**
 * Configuration for real-time data (faster revalidation)
 */
export const realtimeConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 5000, // Refresh every 5 seconds
  dedupingInterval: 1000,
};

/**
 * Configuration for static data (slower revalidation)
 */
export const staticConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 300000, // Refresh every 5 minutes
  revalidateOnFocus: false,
};
