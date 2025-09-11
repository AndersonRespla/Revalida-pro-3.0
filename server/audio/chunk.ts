import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recordingId } = req.query as { recordingId?: string };
    if (!recordingId) return res.status(400).json({ error: 'Missing recordingId' });

    const supabase = getSupabaseAdmin();

    const { data: recording, error: fetchError } = await supabase
      .from('audio_recordings')
      .select('id, status')
      .eq('id', recordingId)
      .single();
    if (fetchError || !recording) return res.status(404).json({ error: 'Recording not found' });
    if (recording.status !== 'recording') return res.status(400).json({ error: 'Recording not active' });

    const audioData = req.body;
    const chunkId = `${recordingId}-${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from('audio-chunks')
      .upload(`${recordingId}/${chunkId}.webm`, audioData, { contentType: 'audio/webm', cacheControl: '0' });
    if (uploadError) return res.status(500).json({ error: 'Failed to upload chunk' });

    await supabase.from('audio_recordings').update({ last_chunk_at: new Date().toISOString() }).eq('id', recordingId);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error in audio/chunk:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


