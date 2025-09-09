import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL as string;
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) as string;
  if (!url || !serviceKey) throw new Error('Missing Supabase environment variables');
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
