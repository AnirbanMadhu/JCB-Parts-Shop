import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Enhanced Prisma Configuration with robust connection pool management
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn', 'query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Connection health monitoring with auto-reconnect
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000; // 5 seconds

const ensureConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    connectionAttempts = 0; // Reset on successful connection
    return true;
  } catch (error: any) {
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

// Periodic connection health check (every 30 seconds)
setInterval(async () => {
  await ensureConnection();
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
  try {
    await prisma.$disconnect();
    console.log('[Prisma] Database connection closed');
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
