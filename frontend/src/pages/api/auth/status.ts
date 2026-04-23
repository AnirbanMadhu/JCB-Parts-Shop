import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/api-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return proxyToBackend(req, res, '/api/auth/status');
}
