// Global fetch configuration to prevent hanging requests
// This patches the global fetch to add a default timeout

const originalFetch = globalThis.fetch;

if (typeof window !== 'undefined') {
  globalThis.fetch = function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    // Default timeout: 30 seconds
    const timeout = 30000;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Merge signals if one was already provided
    const signal = init?.signal;
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }
    
    return originalFetch(input, {
      ...init,
      signal: controller.signal,
    })
      .then((response) => {
        clearTimeout(timeoutId);
        return response;
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          console.error('Request timeout:', input);
          throw new Error('Request timeout after 30 seconds');
        }
        
        throw error;
      });
  };
}

export {};
