import type { VercelRequest, VercelResponse } from '@vercel/node';

// Consolidated API handler for multiple endpoints
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  // Route to appropriate handler based on URL path
  if (url?.includes('/transcribe')) {
    return require('../server/transcribe/index.js').default(req, res);
  } else if (url?.includes('/chatgpt')) {
    return require('./chatgpt.js').default(req, res);
  } else if (url?.includes('/auth-signup')) {
    return require('../server/auth-signup/index.js').default(req, res);
  } else if (url?.includes('/reports/performance')) {
    return require('../server/reports/performance/index.js').default(req, res);
  }
  
  return res.status(404).json({ error: 'Not found' });
}