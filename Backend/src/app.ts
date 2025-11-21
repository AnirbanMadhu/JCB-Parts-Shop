import express from 'express';
import cors from 'cors';
import { json } from 'express';
import partsRouter from './routes/parts';
import invoicesRouter from './routes/invoices';
import invoicesBulkRouter from './routes/invoices-bulk';
import stockRouter from './routes/stock';
import suppliersRouter from './routes/suppliers';
import customersRouter from './routes/customers';
import reportsRouter from './routes/reports';
import authRouter from './routes/auth';
import usersRouter from './routes/users';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}));
app.use(json());

// Custom JSON response handler for Prisma Decimal types
app.use((_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    const stringified = JSON.stringify(body, (_key, value) => {
      // Convert Prisma Decimal to number
      if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
        return parseFloat(value.toString());
      }
      // Convert Date to ISO string
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return originalJson.call(this, JSON.parse(stringified));
  };
  next();
});

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    service: 'JCB Parts Shop Backend'
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/parts', partsRouter);
app.use('/api/invoices/bulk', invoicesBulkRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/stock', stockRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/reports', reportsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
