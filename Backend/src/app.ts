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
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://192.168.1.12:3000',
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
  maxAge: 86400, // 24 hours
}));

// JSON body parser with size limit
app.use(json({ limit: '10mb' }));

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

// Security headers middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.removeHeader('X-Powered-By');
  next();
});

// Request logging middleware (production-safe)
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.socket.remoteAddress;
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${timestamp} - ${method} ${path} - IP: ${ip}`);
  } else {
    // In production, only log non-GET requests or errors
    if (method !== 'GET') {
      console.log(`${timestamp} - ${method} ${path}`);
    }
  }
  next();
});

// Health check endpoints
import healthRouter from './routes/health';
app.use('/api', healthRouter);

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
  // Log full error in development, sanitized in production
  if (process.env.NODE_ENV !== 'production') {
    console.error('Unhandled error:', err);
  } else {
    console.error('Error:', {
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    });
  }
  
  // Send appropriate response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    error: statusCode === 500 ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

export default app;
