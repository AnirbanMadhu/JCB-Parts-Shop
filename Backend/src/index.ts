import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const port = Number(process.env.PORT) || 4001;

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
