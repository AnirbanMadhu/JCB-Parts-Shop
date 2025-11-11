import express from 'express';
import cors from 'cors';
import { json } from 'express';
import partsRouter from './routes/parts';
import invoicesRouter from './routes/invoices';
import stockRouter from './routes/stock';

const app = express();

app.use(cors());
app.use(json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/parts', partsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/stock', stockRouter);

export default app;
