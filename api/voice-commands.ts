import type { VercelRequest, VercelResponse } from '@vercel/node';

// Consolidated voice commands API handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  // Route to appropriate handler based on URL path
  if (url?.includes('/detect')) {
    return require('./voice-commands/detect.js').default(req, res);
  }
  
  return res.status(404).json({ error: 'Not found' });
}
