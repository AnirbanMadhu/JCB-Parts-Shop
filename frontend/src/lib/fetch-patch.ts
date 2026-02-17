// Global fetch configuration to prevent hanging requests
// This patches the global fetch to add a default timeout

const originalFetch = globalThis.fetch;

if (typeof window !== 'undefined') {
  globalThis.fetch = function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    // If caller already provided a signal, don't add our own timeout —
    // let the caller manage abort lifecycle (prevents signal leaks)
    if (init?.signal) {
      return originalFetch(input, init);
    }
    
    // Default timeout: 30 seconds
    const timeout = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
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
          throw new Error('Request timeout after 30 seconds');
        }
        
        throw error;
      });
  };
}

export {};
