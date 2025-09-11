import type { VercelRequest, VercelResponse } from '@vercel/node';

// Consolidated simulation API handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  // Route to appropriate handler based on URL path
  if (url?.includes('/run')) {
    return require('../server/simulation/run.js').default(req, res);
  } else if (url?.includes('/context')) {
    return require('../server/simulation/context.js').default(req, res);
  } else if (url?.includes('/handoff')) {
    return require('../server/simulation/handoff.js').default(req, res);
  } else if (url?.includes('/events')) {
    return require('../server/simulation/events.js').default(req, res);
  } else if (url?.includes('/load')) {
    return require('../server/simulation/load.js').default(req, res);
  }
  
  return res.status(404).json({ error: 'Not found' });
}
