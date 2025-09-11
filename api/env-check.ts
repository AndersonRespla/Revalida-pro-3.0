import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL);
    const hasSupabaseAnon = Boolean(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
    const region = process.env.VERCEL_REGION || 'unknown';

    res.status(200).json({
      ok: true,
      env,
      region,
      vars: {
        OPENAI_API_KEY: hasOpenAI,
        SUPABASE_URL: hasSupabaseUrl,
        SUPABASE_KEY: hasSupabaseAnon,
      }
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}


