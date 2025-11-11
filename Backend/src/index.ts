import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const port = Number(process.env.PORT) || 4001;

app.listen(port, () => {
  console.log(`JCB backend running on port ${port}`);
});
