import express from 'express';
import cors from 'cors';
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
// 1mb is sufficient for a parts shop API - prevents large payload CPU spikes
app.use(json({ limit: '1mb' }));

// Prisma Decimal → number replacer applied at the Express app level.
// app.set('json replacer') is called inside Express's own JSON.stringify():
// one single serialization pass per response (no extra JSON.parse overhead).
const decimalReplacer = (_key: string, value: any) => {
  if (value !== null && typeof value === 'object' && value.constructor?.name === 'Decimal') {
    return parseFloat(value.toString());
  }
  return value;
};
app.set('json replacer', decimalReplacer);

// Cache-control headers — separate from body serialization
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ---------------------------------------------------------------------------
// Malicious probe / exploit scanner blocker
// Immediately drops requests targeting PHP files, WordPress, common CVE paths,
// and other non-Node attack vectors — before any heavy processing occurs.
// ---------------------------------------------------------------------------
const BLOCKED_PATH_PATTERNS = [
  /\.php(\?.*)?$/i,          // Any .php file (PHPUnit RCE, shells, etc.)
  /wp-admin|wp-login|wp-content|wp-includes/i,  // WordPress scans
  /xmlrpc\.php/i,            // WordPress XML-RPC exploits
  /\.env(\.|$)/i,            // .env file theft attempts
  /\/etc\/passwd/i,          // LFI attempts
  /\/proc\/self/i,           // Linux proc traversal
  /\.\.\//,                  // Path traversal
  /admin\/config/i,          // Generic admin config probes
  /phpmyadmin/i,             // phpMyAdmin scans
  /boaform|cgi-bin/i,        // Router/CGI exploits
];

app.use((req, res, next) => {
  const path = req.path;
  if (BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(path))) {
    console.warn(`[SECURITY] Blocked malicious probe: ${req.method} ${path} from ${(req.ip || '').replace(/^::ffff:/, '')}`);
    return res.status(404).end();
  }
  next();
});

// ---------------------------------------------------------------------------
// Lightweight in-memory rate limiter (no new files, no external packages)
// Prevents request storms from causing CPU saturation
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX = 300; // max requests per IP per minute

// Clean up expired entries every 2 minutes to prevent map from growing unbounded
const rateLimitCleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 2 * 60 * 1000);
rateLimitCleanup.unref(); // Don't prevent process exit

app.use((req, res, next) => {
  const ip = (req.ip || req.socket.remoteAddress || 'unknown').replace(/^::ffff:/, '');
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please slow down and try again later.',
    });
  }
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
