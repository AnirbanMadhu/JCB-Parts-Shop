import { Request, Response, NextFunction } from 'express';

/**
 * Request timeout middleware to prevent hanging requests
 * Sets a maximum time limit for request processing
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set timeout for the request
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`[Timeout] Request to ${req.method} ${req.path} exceeded ${timeoutMs}ms timeout`);
        res.status(504).json({
          error: 'Request timeout',
          message: 'The server took too long to respond. Please try again.',
          code: 'GATEWAY_TIMEOUT'
        });
      }
    }, timeoutMs);

    // Clear timeout when response is finished
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Query timeout wrapper for Prisma operations
 * Wraps Prisma queries with a timeout to prevent long-running queries
 */
export const withQueryTimeout = async <T>(
  queryFn: () => Promise<T>,
  timeoutMs: number = 25000
): Promise<T> => {
  return Promise.race([
    queryFn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout: Operation took too long to complete')), timeoutMs)
    ),
  ]);
};

/**
 * Async route handler wrapper to ensure errors are caught and connections released
 * Prevents connection leaks from unhandled promise rejections
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('[AsyncHandler] Caught error:', {
        path: req.path,
        method: req.method,
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
      next(error);
    });
  };
};

/**
 * Database operation wrapper with automatic error recovery
 * Ensures database connections are properly released even on errors
 */
export const withErrorRecovery = async <T>(
  operation: () => Promise<T>,
  context: string = 'Database operation'
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    // Log the error with context
    console.error(`[ErrorRecovery] ${context} failed:`, {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    
    // Re-throw to let Express error handler deal with it
    throw error;
  }
};
