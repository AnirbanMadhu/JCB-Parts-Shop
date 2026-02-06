// Utility functions for reliable fetch operations with timeout and error handling

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
}

/**
 * Fetch with automatic timeout to prevent hanging requests
 * @param url - The URL to fetch
 * @param options - Fetch options including custom timeout (default: 30s)
 * @returns Promise with Response
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Fetch JSON with automatic timeout and parsing
 * @param url - The URL to fetch
 * @param options - Fetch options including custom timeout
 * @returns Promise with parsed JSON data
 */
export async function fetchJSON<T = any>(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, options);
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  return response.json();
}

/**
 * Create an AbortController that can be used to cancel requests
 * Useful for cleanup in useEffect hooks
 */
export function createRequestController() {
  return new AbortController();
}
