import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_supabase';

async function readBuffer(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const bufs: Buffer[] = [];
    req.on('data', (c: any) => bufs.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(bufs)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }
  try {
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'missing_openai_key' });
    }
    const simulationId = String(req.query.simulationId || '');
    const station = Number(req.query.station || 0);
    const audioBuffer = await readBuffer(req);

    // Salvar áudio no Supabase Storage (bucket: recordings)
    const supabase = getSupabaseAdmin();
    const bucket = 'recordings';
    const path = `${simulationId}/station-${station}-${Date.now()}.webm`;
    await supabase.storage.createBucket(bucket, { public: false }).catch(() => {});
    const upload = await supabase.storage.from(bucket).upload(path, audioBuffer, {
      contentType: req.headers['content-type'] || 'audio/webm',
      upsert: false,
    });
    if (upload.error) throw upload.error;

    // Transcrever
    const form = new FormData();
    const blob = new Blob([audioBuffer], { type: req.headers['content-type'] || 'audio/webm' });
    form.append('file', blob, 'audio.webm');
    form.append('model', 'whisper-1');

    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form as any,
    });
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(500).json({ ok: false, error: 'whisper_error', detail: errText });
    }
    const json: any = await resp.json();
    const text = String(json?.text || '');

    // Registrar transcrição em tabela (MVP) se existir tabela transcripts(simulation_id text, station int, transcript text, audio_path text)
    await supabase.from('transcripts').insert({ simulation_id: simulationId, station, transcript: text, audio_path: `${bucket}/${path}` }).catch(() => {});

    res.status(200).json({ ok: true, transcript: text, simulationId, station, audioPath: `${bucket}/${path}` });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: 'server_error', detail: String(e?.message || e) });
  }
}
