import type { VercelRequest, VercelResponse } from '@vercel/node';

// Consolidated feedback API handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  // Route to appropriate handler based on URL path
  if (url?.includes('/generate')) {
    return require('../server/feedback/generate.js').default(req, res);
  } else if (url?.includes('/get')) {
    return require('../server/feedback/get.js').default(req, res);
  }
  
  return res.status(404).json({ error: 'Not found' });
}