import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { 
  prisma?: PrismaClient;
  connectionMetrics?: {
    queries: number;
    errors: number;
    slowQueries: number;
    lastHealthCheck: Date;
  };
};

// Initialize connection metrics
if (!globalForPrisma.connectionMetrics) {
  globalForPrisma.connectionMetrics = {
    queries: 0,
    errors: 0,
    slowQueries: 0,
    lastHealthCheck: new Date()
  };
}

// Reset counters periodically to prevent unbounded growth over months
const METRICS_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const metricsResetTimer = setInterval(() => {
  if (globalForPrisma.connectionMetrics) {
    const m = globalForPrisma.connectionMetrics;
    if (m.queries > 100000) {
      console.log(`[Prisma] Resetting metrics counters (queries: ${m.queries}, errors: ${m.errors})`);
      m.queries = 0;
      m.errors = 0;
      m.slowQueries = 0;
    }
  }
}, METRICS_RESET_INTERVAL);
metricsResetTimer.unref(); // Don't prevent process exit

// Enhanced Prisma Configuration with robust connection pool management
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']  // Minimal logging in production (no query event listeners)
      : [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' }
        ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Query performance monitoring - only attach event listeners in development
// In production, event-level logging is disabled to prevent memory overhead
const SLOW_QUERY_THRESHOLD = 3000; // 3 seconds

if (process.env.NODE_ENV !== 'production' && typeof (prisma as any).$on === 'function') {
  (prisma as any).$on('query', (e: any) => {
    globalForPrisma.connectionMetrics!.queries++;
    
    if (e.duration > SLOW_QUERY_THRESHOLD) {
      globalForPrisma.connectionMetrics!.slowQueries++;
      console.warn(`[Prisma] Slow query detected (${e.duration}ms):`, {
        query: e.query.substring(0, 100),
        params: e.params,
        duration: e.duration
      });
    }
  });

  (prisma as any).$on('error', (e: any) => {
    globalForPrisma.connectionMetrics!.errors++;
    console.error('[Prisma] Query error:', e.message);
  });

  (prisma as any).$on('warn', (e: any) => {
    console.warn('[Prisma] Warning:', e.message);
  });
}

// Export metrics for monitoring
export const getConnectionMetrics = () => globalForPrisma.connectionMetrics;

// Connection health monitoring with auto-reconnect
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 5000; // 5 seconds

const ensureConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    connectionAttempts = 0; // Reset on successful connection
    globalForPrisma.connectionMetrics!.lastHealthCheck = new Date();
    return true;
  } catch (error: any) {
    globalForPrisma.connectionMetrics!.errors++;
    console.error(`[Prisma] Connection check failed (attempt ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}):`, error.message);
    
    if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      connectionAttempts++;
      console.log(`[Prisma] Attempting to reconnect in ${RECONNECT_INTERVAL / 1000}s...`);
      
      try {
        // Only $connect — don't $disconnect first as it kills active queries
        await new Promise(resolve => setTimeout(resolve, RECONNECT_INTERVAL));
        await prisma.$connect();
        console.log('[Prisma] Reconnection successful');
        connectionAttempts = 0;
        return true;
      } catch (reconnectError: any) {
        console.error('[Prisma] Reconnection failed:', reconnectError.message);
        return false;
      }
    }
    
    // Reset attempts after max reached so future health checks can retry
    connectionAttempts = 0;
    console.error('[Prisma] Max reconnection attempts reached. Will retry on next health check cycle.');
    return false;
  }
};

// Periodic connection health check (every 5 minutes)
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const healthCheckInterval = setInterval(async () => {
  try {
    await ensureConnection();
  } catch (err) {
    // Swallow - ensureConnection already logs errors
  }
}, HEALTH_CHECK_INTERVAL);
healthCheckInterval.unref(); // Don't prevent process exit

// Initial connection with retry mechanism
const initializeConnection = async () => {
  try {
    await prisma.$connect();
    const isConnected = await ensureConnection();
    if (isConnected) {
      console.log('[Prisma] Database connection initialized successfully');
    } else {
      console.error('[Prisma] Failed to establish initial database connection');
    }
  } catch (error: any) {
    console.error('[Prisma] Database initialization error:', error.message);
    // Retry connection
    setTimeout(initializeConnection, RECONNECT_INTERVAL);
  }
};

// Initialize connection on startup
initializeConnection();

// Track if shutdown is already in progress to prevent re-entry
let isShuttingDown = false;

// Graceful shutdown - disconnect Prisma on process termination
const shutdown = async (signal: string, exitCode: number = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`[Prisma] Shutting down gracefully (signal: ${signal})...`);
  
  // Clear intervals
  clearInterval(healthCheckInterval);
  clearInterval(metricsResetTimer);
  
  // Log final metrics
  const metrics = globalForPrisma.connectionMetrics!;
  console.log('[Prisma] Final metrics:', {
    totalQueries: metrics.queries,
    errors: metrics.errors,
    slowQueries: metrics.slowQueries,
    uptime: Math.floor(process.uptime()) + 's'
  });
  
  try {
    await prisma.$disconnect();
    console.log('[Prisma] Database connection closed cleanly');
  } catch (error: any) {
    console.error('[Prisma] Error during shutdown:', error.message);
  }
  
  // Force exit after 5s if still hanging
  const forceExitTimer = setTimeout(() => {
    console.error('[Prisma] Forced exit after timeout');
    process.exit(exitCode);
  }, 5000);
  forceExitTimer.unref();
  
  process.exit(exitCode);
};

process.on('SIGINT', () => shutdown('SIGINT', 0));
process.on('SIGTERM', () => shutdown('SIGTERM', 0));

// Handle uncaught exceptions - exit with error code so Docker restarts the container
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  // Synchronous exit — async shutdown is unreliable after uncaughtException
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Exit so Docker restarts in a clean state
  process.exit(1);
});
