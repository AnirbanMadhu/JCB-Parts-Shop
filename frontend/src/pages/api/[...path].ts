import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/api-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pathParam = req.query.path;
  const path = Array.isArray(pathParam) ? pathParam.join('/') : pathParam ?? '';

  return proxyToBackend(req, res, `/api/${path}`);
}
