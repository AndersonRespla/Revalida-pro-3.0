import type { VercelRequest, VercelResponse } from '@vercel/node';

// Consolidated audio API handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  // Route to appropriate handler based on URL path
  if (url?.includes('/start')) {
    return require('./audio/start.js').default(req, res);
  } else if (url?.includes('/finish')) {
    return require('./audio/finish.js').default(req, res);
  } else if (url?.includes('/chunk')) {
    return require('./audio/chunk.js').default(req, res);
  }
  
  return res.status(404).json({ error: 'Not found' });
}
