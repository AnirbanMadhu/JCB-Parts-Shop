import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { withQueryTimeout } from '../middleware/timeout';

const router = Router();

// Comprehensive health check endpoint with timeout protection
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
    connections: {
      active: 0,
      idle: 0,
    }
  };

  try {
    // Check database connection with timeout (5 seconds)
    await withQueryTimeout(
      () => prisma.$queryRaw`SELECT 1`,
      5000
    );
    checks.database = 'connected';

    // Get connection pool stats with timeout
    try {
      const connectionStats: any = await withQueryTimeout(
        () => prisma.$queryRaw`
          SELECT 
            count(*) FILTER (WHERE state = 'active') as active,
            count(*) FILTER (WHERE state = 'idle') as idle,
            count(*) as total
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `,
        3000
      );
      
      if (connectionStats && connectionStats.length > 0) {
        checks.connections = {
          active: Number(connectionStats[0].active || 0),
          idle: Number(connectionStats[0].idle || 0),
        };
      }
    } catch (statsError) {
      console.error('Failed to get connection stats:', statsError);
    }
  } catch (error: any) {
    console.error('[Health Check] Database check failed:', error.message);
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
      connections: checks.connections,
    });
  }

  res.status(statusCode).json(checks);
});

// Readiness check (for Kubernetes/Docker health checks) with timeout
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await withQueryTimeout(
      () => prisma.$queryRaw`SELECT 1`,
      5000
    );
    res.status(200).json({ ready: true });
  } catch (error: any) {
    console.error('[Readiness Check] Failed:', error.message);
    res.status(503).json({ ready: false, error: 'Database unavailable' });
  }
});

// Liveness check (for Kubernetes/Docker liveness probes)
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

// Database data verification endpoint (temporary debug)
router.get('/data-check', async (_req: Request, res: Response) => {
  try {
    const [
      totalParts,
      activeParts,
      totalSuppliers,
      activeSuppliers,
      totalCustomers,
      activeCustomers,
      totalInvoices,
      invoicesByType,
      totalTransactions
    ] = await Promise.all([
      prisma.part.count(),
      prisma.part.count({ where: { isDeleted: false } }),
      prisma.supplier.count(),
      prisma.supplier.count({ where: { isDeleted: false } }),
      prisma.customer.count(),
      prisma.customer.count({ where: { isDeleted: false } }),
      prisma.invoice.count(),
      prisma.invoice.groupBy({
        by: ['type'],
        _count: true
      }),
      prisma.inventoryTransaction.count()
    ]);

    const sampleParts = await prisma.part.findMany({
      take: 3,
      orderBy: { id: 'asc' }
    });

    const sampleSuppliers = await prisma.supplier.findMany({
      take: 3,
      orderBy: { id: 'asc' }
    });

    const sampleInvoices = await prisma.invoice.findMany({
      take: 3,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        date: true,
        total: true
      }
    });

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      counts: {
        parts: { total: totalParts, active: activeParts, deleted: totalParts - activeParts },
        suppliers: { total: totalSuppliers, active: activeSuppliers, deleted: totalSuppliers - activeSuppliers },
        customers: { total: totalCustomers, active: activeCustomers, deleted: totalCustomers - activeCustomers },
        invoices: { 
          total: totalInvoices,
          byType: invoicesByType.reduce((acc, item) => ({ ...acc, [item.type]: item._count }), {})
        },
        inventoryTransactions: totalTransactions
      },
      samples: {
        parts: sampleParts,
        suppliers: sampleSuppliers,
        invoices: sampleInvoices
      },
      message: totalParts === 0 ? 'WARNING: No parts found in database!' : 
               totalInvoices === 0 ? 'WARNING: No invoices found in database!' :
               'Data exists in database'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'Failed to check database data'
    });
  }
});

export default router;
