import type { VercelRequest, VercelResponse } from '@vercel/node';

// Consolidated simulations API handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  // Route to appropriate handler based on URL path
  if (url?.includes('/hybrid/create')) {
    return require('./simulations/hybrid/create.js').default(req, res);
  } else if (url?.includes('/hybrid/join')) {
    return require('./simulations/hybrid/join.js').default(req, res);
  }
  
  return res.status(404).json({ error: 'Not found' });
}
