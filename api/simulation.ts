import type { VercelRequest, VercelResponse } from '@vercel/node';

// Consolidated simulation API handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  // Route to appropriate handler based on URL path
  if (url?.includes('/run')) {
    return require('./simulation/run.js').default(req, res);
  } else if (url?.includes('/context')) {
    return require('./simulation/context.js').default(req, res);
  } else if (url?.includes('/handoff')) {
    return require('./simulation/handoff.js').default(req, res);
  } else if (url?.includes('/events')) {
    return require('./simulation/events.js').default(req, res);
  } else if (url?.includes('/load')) {
    return require('./simulation/load.js').default(req, res);
  }
  
  return res.status(404).json({ error: 'Not found' });
}
