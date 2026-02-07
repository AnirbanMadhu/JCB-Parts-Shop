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
