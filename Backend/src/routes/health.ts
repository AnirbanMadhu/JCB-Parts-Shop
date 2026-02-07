import { Router, Request, Response } from 'express';
import { prisma, getConnectionMetrics } from '../prisma';
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
  
  // Add connection metrics
  const metrics = getConnectionMetrics();
  const response: any = {
    status: checks.status,
    timestamp: checks.timestamp,
    database: checks.database,
    connections: checks.connections,
  };
  
  // Include metrics in response
  if (process.env.NODE_ENV !== 'production') {
    response.uptime = checks.uptime;
    response.environment = checks.environment;
    response.version = checks.version;
    response.email = checks.email;
    response.metrics = metrics;
  } else {
    // Even in production, show critical metrics
    response.metrics = {
      totalQueries: metrics?.queries || 0,
      errorRate: metrics && metrics.queries > 0 ? ((metrics.errors / metrics.queries) * 100).toFixed(2) + '%' : '0%'
    };
  }

  res.status(statusCode).json(response);
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

// Monitoring endpoint - detailed metrics for troubleshooting
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = getConnectionMetrics();
    
    // Get database statistics with timeout
    let dbStats = null;
    try {
      const stats: any = await withQueryTimeout(
        () => prisma.$queryRaw`
          SELECT 
            (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as total_connections,
            (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections,
            (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle_connections,
            (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle in transaction') as idle_in_transaction,
            pg_database_size(current_database()) as database_size,
            (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
        `,
        5000
      );
      
      if (stats && stats.length > 0) {
        dbStats = {
          totalConnections: Number(stats[0].total_connections),
          activeConnections: Number(stats[0].active_connections),
          idleConnections: Number(stats[0].idle_connections),
          idleInTransaction: Number(stats[0].idle_in_transaction),
          databaseSize: Number(stats[0].database_size),
          maxConnections: Number(stats[0].max_connections),
          utilizationPercent: ((Number(stats[0].total_connections) / Number(stats[0].max_connections)) * 100).toFixed(2)
        };
      }
    } catch (error: any) {
      console.error('[Metrics] Failed to get database stats:', error.message);
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      application: {
        totalQueries: metrics?.queries || 0,
        totalErrors: metrics?.errors || 0,
        slowQueries: metrics?.slowQueries || 0,
        errorRate: metrics && metrics.queries > 0 ? ((metrics.errors / metrics.queries) * 100).toFixed(2) + '%' : '0%',
        slowQueryRate: metrics && metrics.queries > 0 ? ((metrics.slowQueries / metrics.queries) * 100).toFixed(2) + '%' : '0%',
        lastHealthCheck: metrics?.lastHealthCheck
      },
      database: dbStats,
      warnings: [
        ...(dbStats && Number(dbStats.utilizationPercent) > 80 ? [`High connection utilization: ${dbStats.utilizationPercent}%`] : []),
        ...(metrics && metrics.queries > 20 && (metrics.errors / metrics.queries) > 0.05 ? ['High error rate detected'] : []),
        ...(metrics && metrics.queries > 50 && (metrics.slowQueries / metrics.queries) > 0.1 ? ['High slow query rate detected'] : [])
      ]
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
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
