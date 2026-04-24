import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

function loadEnvFile() {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
  ];

  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) {
    console.warn('[Config] No .env file found in expected locations. Using process environment only.');
    return;
  }

  dotenv.config({ path: envPath });
  console.log(`[Config] Loaded environment from: ${envPath}`);
}

loadEnvFile();

import http from 'http';
import app from './app';
import { prisma } from './prisma';

async function logDatabaseIdentityAndCounts() {
  try {
    const dbInfo = await prisma.$queryRaw<Array<{ db_name: string; db_user: string }>>`
      SELECT current_database()::text as db_name, current_user::text as db_user
    `;

    const [users, customers, suppliers, parts, invoices] = await Promise.all([
      prisma.user.count(),
      prisma.customer.count(),
      prisma.supplier.count(),
      prisma.part.count(),
      prisma.invoice.count(),
    ]);

    const dbName = dbInfo?.[0]?.db_name || 'unknown';
    const dbUser = dbInfo?.[0]?.db_user || 'unknown';
    console.log(`[Database] Connected to DB: ${dbName} as ${dbUser}`);
    console.log('[Database] Row counts:', {
      users,
      customers,
      suppliers,
      parts,
      invoices,
    });
  } catch (error: any) {
    console.error('[Database] Failed to fetch database identity/counts:', error?.message || error);
  }
}

// Validate critical environment variables
if (!process.env.DATABASE_URL) {
  console.error('FATAL ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL ERROR: JWT_SECRET must be set and at least 32 characters long');
  process.exit(1);
}

const port = Number(process.env.PORT) || 4001;

// Validate port number
if (isNaN(port) || port < 1 || port > 65535) {
  console.error('FATAL ERROR: Invalid PORT number. Must be between 1 and 65535');
  process.exit(1);
}

const server = http.createServer(app);

// ---------------------------------------------------------------------------
// Graceful shutdown — called on SIGTERM (Docker stop) and SIGINT (Ctrl+C)
// Sequence: stop accepting new connections → drain existing → close Prisma → exit
// Without this, Docker kills the process hard after the stop_grace_period,
// leaving PostgreSQL connections open and potentially spawning zombie processes.
// ---------------------------------------------------------------------------
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[Shutdown] Received ${signal}. Starting graceful shutdown...`);

  // 1. Stop the HTTP server from accepting new connections.
  //    Existing keep-alive connections are forcibly destroyed after 5 s.
  const forceCloseTimer = setTimeout(() => {
    console.warn('[Shutdown] Forcing close of lingering connections');
    server.closeAllConnections?.(); // Node ≥ 18.02
  }, 5000);
  forceCloseTimer.unref();

  await new Promise<void>((resolve) => {
    server.close((err) => {
      if (err) console.error('[Shutdown] HTTP server close error:', err.message);
      else console.log('[Shutdown] HTTP server closed');
      clearTimeout(forceCloseTimer);
      resolve();
    });
  });

  // 2. Disconnect Prisma — flushes the connection pool back to PostgreSQL.
  //    This is the most important step: without it every restart leaks a slot
  //    from postgres max_connections (100) and eventually new connections fail.
  try {
    await prisma.$disconnect();
    console.log('[Shutdown] Prisma disconnected');
  } catch (err: any) {
    console.error('[Shutdown] Prisma disconnect error:', err.message);
  }

  console.log(`[Shutdown] Graceful shutdown complete`);
  process.exit(0);
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// Catch unhandled rejections so they don't silently kill the process
process.on('unhandledRejection', (reason: unknown) => {
  // Log but do NOT exit — an unhandled rejection in one request must not
  // bring down the entire server. The request will timeout via the timeout
  // middleware and the client will receive a 504. Docker keeps the process alive.
  console.error('[Process] Unhandled promise rejection (non-fatal):', reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[Process] Uncaught exception:', err.message, err.stack);
  // Hard-kill safety net: if graceful shutdown hangs for any reason, force-exit
  // so Docker's restart policy can bring the process back in a clean state.
  const hardKill = setTimeout(() => {
    console.error('[Process] Graceful shutdown timed out after uncaughtException — force exiting');
    process.exit(1);
  }, 10000);
  hardKill.unref();
  gracefulShutdown('uncaughtException').catch(() => process.exit(1));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 JCB Parts Shop Backend`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server running on port ${port}`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔗 Local: http://localhost:${port}`);
    console.log(`🔗 Health: http://localhost:${port}/api/health`);
  }

  void logDatabaseIdentityAndCounts();
  
  console.log(`✅ Server started successfully at ${new Date().toISOString()}`);
});
