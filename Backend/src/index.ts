import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const port = Number(process.env.PORT) || 4001;

app.listen(port, '0.0.0.0', () => {
  console.log(`JCB backend running on port ${port}`);
  console.log(`Local: http://localhost:${port}`);
  console.log(`Network: http://192.168.1.12:${port}`);
});
