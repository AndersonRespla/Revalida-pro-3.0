import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase.js';
import { withTimeout, timeoutPresets } from '../../lib/timeout-utils.js';
import { circuitBreakers } from '../../lib/circuit-breaker.js';

interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

async function consolidateAudioChunks(supabase: any, recordingId: string): Promise<{ audioBuffer: Buffer; chunksCount: number }> {
  const { data: files, error: listError } = await supabase.storage
    .from('audio-chunks')
    .list(recordingId, { sortBy: { column: 'created_at', order: 'asc' } });
  if (listError || !files || files.length === 0) throw new Error('Nenhum chunk de áudio encontrado');

  const chunks: Buffer[] = [];
  for (const file of files) {
    const { data, error } = await supabase.storage
      .from('audio-chunks')
      .download(`${recordingId}/${file.name}`);
    if (error) continue;
    const buffer = Buffer.from(await data.arrayBuffer());
    chunks.push(buffer);
  }
  return { audioBuffer: Buffer.concat(chunks), chunksCount: files.length };
}

async function transcribeAudio(audioBuffer: Buffer, language: string = 'pt'): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key não configurada');

  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: 'audio/webm' });
  form.append('file', blob, 'audio.webm');
  form.append('model', 'whisper-1');
  form.append('language', language);
  form.append('response_format', 'verbose_json');

  const response = await circuitBreakers.openai.execute(async () => {
    return withTimeout(
      fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: form as any
      }),
      timeoutPresets.transcription
    );
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na transcrição: ${response.status} - ${errorText}`);
  }
  const result = await response.json();
  return { text: result.text || '', language: result.language || language, duration: result.duration };
}

async function extractKeywords(transcript: string, criteria: any[]): Promise<string[]> {
  const keywords: Set<string> = new Set();
  const medicalTerms = ['dor','febre','tosse','dispneia','náusea','vômito','cefaleia','tontura','fraqueza','edema','icterícia','hipertensão','diabetes','alergia','medicamento'];
  criteria.forEach(criterion => {
    const terms = String(criterion?.name || '').toLowerCase().split(' ');
    terms.forEach((term: string) => { if (term.length > 3) keywords.add(term); });
  });
  const transcriptLower = transcript.toLowerCase();
  medicalTerms.forEach(term => { if (transcriptLower.includes(term)) keywords.add(term); });
  return Array.from(keywords);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  try {
    const { recordingId } = req.body as { recordingId: string };
    if (!recordingId) return res.status(400).json({ ok: false, error: 'missing_recording_id' });

    const supabase = getSupabaseAdmin();
    const { data: recording, error: recordingError } = await supabase
      .from('audio_recordings')
      .select(`*, simulation:simulations!simulation_id (*, simulation_stations (*, station:stations!station_id (*, criteria:station_criteria (*))))`)
      .eq('id', recordingId)
      .single();
    if (recordingError || !recording) return res.status(404).json({ ok: false, error: 'recording_not_found' });
    if (recording.status !== 'recording') return res.status(400).json({ ok: false, error: 'recording_not_active' });

    await supabase.from('audio_recordings').update({ status: 'processing', finished_at: new Date().toISOString() }).eq('id', recordingId);

    const { audioBuffer, chunksCount } = await consolidateAudioChunks(supabase, recordingId);

    const audioPath = `consolidated/${recording.simulation_id}/station-${recording.station}-${Date.now()}.webm`;
    const { error: uploadError } = await supabase.storage.from('recordings').upload(audioPath, audioBuffer, { contentType: 'audio/webm', cacheControl: '3600' });
    if (uploadError) throw uploadError;

    await supabase.from('audio_recordings').update({ status: 'ready_for_transcription', audio_url: audioPath, chunks_count: chunksCount, file_size_bytes: audioBuffer.length }).eq('id', recordingId);

    const transcription = await transcribeAudio(audioBuffer);

    const currentStation = recording.simulation?.simulation_stations?.find((s: any) => s.station_order === recording.station);
    const criteria = currentStation?.station?.criteria || [];
    const keywords = await extractKeywords(transcription.text, criteria);

    await supabase.from('transcripts').insert({
      simulation_id: recording.simulation_id,
      station: recording.station,
      transcript: transcription.text,
      audio_path: audioPath,
      language: transcription.language,
      duration_seconds: transcription.duration,
      keywords,
      criteria_ids: criteria.map((c: any) => c.id),
      recording_id: recordingId,
      created_at: new Date().toISOString()
    });

    await supabase.from('audio_recordings').update({
      status: 'transcribed',
      transcript: transcription.text,
      duration_seconds: transcription.duration,
      metadata: { language: transcription.language, keywords, criteria_count: criteria.length }
    }).eq('id', recordingId);

    await supabase.from('simulation_events').insert({
      simulation_id: recording.simulation_id,
      station_number: recording.station,
      event_type: 'transcription_completed',
      event_data: { recording_id: recordingId, transcript_length: transcription.text.length, keywords_count: keywords.length, duration_seconds: transcription.duration }
    });

    try {
      const { data: chunks } = await supabase.storage.from('audio-chunks').list(recordingId);
      if (chunks && chunks.length > 0) {
        const filesToDelete = chunks.map((f: any) => `${recordingId}/${f.name}`);
        await supabase.storage.from('audio-chunks').remove(filesToDelete);
      }
    } catch {}

    return res.status(200).json({ ok: true, recordingId, transcript: transcription.text, keywords, audioPath, duration: transcription.duration, criteria: criteria.map((c: any) => ({ id: c.id, name: c.name, weight: c.weight })) });

  } catch (error) {
    console.error('💥 Erro ao finalizar gravação:', error);
    return res.status(500).json({ ok: false, error: 'recording_finish_failed', message: error instanceof Error ? error.message : 'Erro desconhecido' });
  }
}


