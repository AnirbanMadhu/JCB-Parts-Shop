import dotenv from 'dotenv';
dotenv.config();

import app from './app';

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

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 JCB Parts Shop Backend`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server running on port ${port}`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔗 Local: http://localhost:${port}`);
    console.log(`🔗 Health: http://localhost:${port}/api/health`);
  }
  
  console.log(`✅ Server started successfully at ${new Date().toISOString()}`);
});
