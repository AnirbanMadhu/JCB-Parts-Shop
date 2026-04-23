import type { NextApiRequest, NextApiResponse } from 'next';

function getBackendBaseUrl() {
  const backendBaseUrl = process.env.INTERNAL_API_URL;

  if (!backendBaseUrl) {
    throw new Error('INTERNAL_API_URL is not configured');
  }

  return backendBaseUrl;
}

function buildTargetUrl(req: NextApiRequest, targetPath: string) {
  const backendBaseUrl = getBackendBaseUrl();
  const requestUrl = new URL(req.url ?? '', 'http://localhost');
  const baseUrl = backendBaseUrl.endsWith('/') ? backendBaseUrl : `${backendBaseUrl}/`;
  const targetUrl = new URL(targetPath, baseUrl);

  targetUrl.search = requestUrl.search;

  return targetUrl;
}

function buildHeaders(req: NextApiRequest) {
  const headers = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (key === 'host' || key === 'content-length' || key === 'connection') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
      return;
    }

    headers.set(key, value);
  });

  return headers;
}

function buildBody(req: NextApiRequest) {
  const method = (req.method ?? 'GET').toUpperCase();

  if (method === 'GET' || method === 'HEAD') {
    return undefined;
  }

  if (req.body === undefined || req.body === null) {
    return undefined;
  }

  if (typeof req.body === 'string') {
    return req.body;
  }

  return JSON.stringify(req.body);
}

export async function proxyToBackend(
  req: NextApiRequest,
  res: NextApiResponse,
  targetPath: string
) {
  try {
    const targetUrl = buildTargetUrl(req, targetPath).toString();
    const method = req.method || 'GET';
    
    console.log(`[API Proxy] ${method} ${targetPath} → ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: method,
      headers: buildHeaders(req),
      body: buildBody(req),
    });

    console.log(`[API Proxy] Response status: ${response.status}`);

    res.status(response.status);

    response.headers.forEach((value, key) => {
      const normalizedKey = key.toLowerCase();

      if (
        normalizedKey === 'content-length' ||
        normalizedKey === 'transfer-encoding' ||
        normalizedKey === 'connection'
      ) {
        return;
      }

      res.setHeader(key, value);
    });

    const body = await response.text();
    res.end(body);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'API proxy failed' });
  }
}
