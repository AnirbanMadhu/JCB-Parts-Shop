import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { json } from 'express';
import { requestTimeout } from './middleware/timeout';
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

// Trust proxy - important for getting correct client IP behind reverse proxy
app.set('trust proxy', 1);

// Helmet - security headers (replaces manual security headers below)
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for API-only backend
  crossOriginEmbedderPolicy: false,
}));

// Global rate limiter - max 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/api/health' || req.path === '/api/live',
});
app.use(globalLimiter);

// Strict rate limiter for auth endpoints - max 10 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again after 15 minutes.' },
});

// Request timeout middleware - prevent hanging requests
app.use(requestTimeout(30000)); // 30 seconds timeout

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://192.168.1.12:3000',
    ];

// Validate allowed origins
if (allowedOrigins.length === 0) {
  console.warn('WARNING: No allowed origins configured for CORS');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[SECURITY] Blocked CORS request from unauthorized origin: ${origin}`);
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
// Uses replacer function directly — avoids double JSON.stringify + JSON.parse overhead
const decimalReplacer = (_key: string, value: any) => {
  if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
    return parseFloat(value.toString());
  }
  return value;
};

app.use((_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // Express's res.json already calls JSON.stringify internally;
    // pass the replacer via app.set so it handles Decimal conversion in a single pass
    return originalJson.call(this, JSON.parse(JSON.stringify(body, decimalReplacer)));
  };
  next();
});

// Security headers middleware (additional headers beyond helmet)
app.use((_req, res, next) => {
  res.removeHeader('X-Powered-By');
  next();
});

// Request logging middleware with slow-request detection (production-safe)
app.use((req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  
  if (process.env.NODE_ENV !== 'production') {
    const ip = req.ip || req.socket.remoteAddress;
    console.log(`${timestamp} - ${method} ${path} - IP: ${ip}`);
  } else {
    // In production, only log non-GET requests
    if (method !== 'GET') {
      console.log(`${timestamp} - ${method} ${path}`);
    }
  }
  
  // Detect slow requests (potential connection leaks / timeouts)
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 15000) {
      console.warn(`[Performance] Slow request: ${method} ${path} took ${duration}ms`);
    }
  });
  
  next();
});

// Health check endpoints
import healthRouter from './routes/health';
app.use('/api', healthRouter);

// API Routes - auth routes get stricter rate limiting
app.use('/api/auth', authLimiter, authRouter);
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
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: 'The requested resource does not exist'
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Log full error in development, sanitized in production
  if (process.env.NODE_ENV !== 'production') {
    console.error('Unhandled error:', err);
  } else {
    console.error('[ERROR]', {
      message: err.message,
      code: err.code,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle specific error types
  let statusCode = err.statusCode || 500;
  let errorMessage = 'Internal server error';
  
  // Handle JSON parsing errors
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    errorMessage = 'Invalid JSON in request body';
  }
  
  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    statusCode = 400;
    if (err.code === 'P2002') {
      errorMessage = 'A record with this value already exists';
    } else if (err.code === 'P2025') {
      errorMessage = 'Record not found';
    } else if (err.code === 'P2024' || err.code === 'P1001' || err.code === 'P1002') {
      // Connection timeout or connection issues
      statusCode = 504;
      errorMessage = 'Database connection timeout - please try again';
      console.error('[CRITICAL] Database connection error:', err.code);
    } else {
      errorMessage = 'Database operation failed';
    }
  }
  
  // Handle timeout errors
  if (err.message && err.message.includes('timeout')) {
    statusCode = 504;
    errorMessage = 'Request timeout - operation took too long';
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = err.message;
  }
  
  // Send appropriate response
  res.status(statusCode).json({ 
    error: statusCode === 500 && process.env.NODE_ENV === 'production' ? errorMessage : err.message,
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      code: err.code 
    })
  });
});

export default app;
