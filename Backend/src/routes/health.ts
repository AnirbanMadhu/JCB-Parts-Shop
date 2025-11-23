import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Comprehensive health check endpoint
router.get('/health', async (_req: Request, res: Response) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'JCB Parts Shop Backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    database: 'unknown',
    email: 'unknown',
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch (error) {
    checks.database = 'disconnected';
    checks.status = 'degraded';
  }

  // Check email configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    checks.email = 'configured';
  } else {
    checks.email = 'not configured';
    if (process.env.NODE_ENV === 'production') {
      checks.status = 'degraded';
    }
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;
  
  // Only send detailed info in non-production
  if (process.env.NODE_ENV === 'production') {
    return res.status(statusCode).json({
      status: checks.status,
      timestamp: checks.timestamp,
      database: checks.database,
    });
  }

  res.status(statusCode).json(checks);
});

// Readiness check (for Kubernetes/Docker health checks)
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

// Liveness check (for Kubernetes/Docker liveness probes)
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

export default router;
