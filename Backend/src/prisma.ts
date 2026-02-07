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

// Enhanced Prisma Configuration with robust connection pool management and query monitoring
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
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

// Query performance monitoring - detect slow queries before they cause timeouts
const SLOW_QUERY_THRESHOLD = 3000; // 3 seconds

// Type-safe event listeners
if (typeof (prisma as any).$on === 'function') {
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
const MAX_RECONNECT_ATTEMPTS = 5;
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
        await prisma.$disconnect();
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
    
    console.error('[Prisma] Max reconnection attempts reached. Manual intervention required.');
    return false;
  }
};

// Periodic connection health check and cleanup (every 30 seconds)
const healthCheckInterval = setInterval(async () => {
  await ensureConnection();
  
  // Log metrics every 5 minutes
  const metrics = globalForPrisma.connectionMetrics!;
  if (metrics.queries > 0 && metrics.queries % 100 === 0) {
    console.log('[Prisma] Connection metrics:', {
      totalQueries: metrics.queries,
      errors: metrics.errors,
      slowQueries: metrics.slowQueries,
      errorRate: ((metrics.errors / metrics.queries) * 100).toFixed(2) + '%',
      lastCheck: metrics.lastHealthCheck
    });
  }
  
  // Alert if error rate is too high
  if (metrics.errors > 0 && metrics.queries > 20) {
    const errorRate = (metrics.errors / metrics.queries) * 100;
    if (errorRate > 5) {
      console.error(`[Prisma] HIGH ERROR RATE DETECTED: ${errorRate.toFixed(2)}% - Consider investigating database issues`);
    }
  }
  
  // Alert if too many slow queries
  if (metrics.slowQueries > 10 && metrics.queries > 50) {
    const slowRate = (metrics.slowQueries / metrics.queries) * 100;
    if (slowRate > 10) {
      console.warn(`[Prisma] HIGH SLOW QUERY RATE: ${slowRate.toFixed(2)}% - Consider optimizing queries or adding indexes`);
    }
  }
}, 30000);

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

// Graceful shutdown - disconnect Prisma on process termination
const shutdown = async () => {
  console.log('[Prisma] Shutting down gracefully...');
  
  // Clear health check interval
  clearInterval(healthCheckInterval);
  
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
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('beforeExit', async () => {
  console.log('[Prisma] Process ending, disconnecting...');
  await prisma.$disconnect();
});

// Handle uncaught exceptions and promise rejections
process.on('uncaughtException', async (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  await shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection at:', promise, 'reason:', reason);
});
