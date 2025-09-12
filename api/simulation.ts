import type { VercelRequest, VercelResponse } from '@vercel/node';

// Consolidated simulation API handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  const route = (() => {
    try {
      const u = new URL(url || '/', 'http://localhost');
      return u.searchParams.get('route') || '';
    } catch { return ''; }
  })();
  
  // Route to appropriate handler based on URL path
  if (url?.includes('/run') || route === 'run') {
    return require('../server/simulation/run.js').default(req, res);
  } else if (url?.includes('/context') || route === 'context') {
    return require('../server/simulation/context.js').default(req, res);
  } else if (url?.includes('/handoff') || route === 'handoff') {
    return require('../server/simulation/handoff.js').default(req, res);
  } else if (url?.includes('/events') || route === 'events') {
    return require('../server/simulation/events.js').default(req, res);
  } else if (url?.includes('/load') || route === 'load') {
    return require('../server/simulation/load.js').default(req, res);
  }
  
  return res.status(404).json({ error: 'Not found' });
}
