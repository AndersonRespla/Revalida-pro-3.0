import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../_supabase.js';

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
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { simulationId, stationNumber, audioRecordingId } = req.body;

    if (!simulationId || !stationNumber || !audioRecordingId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_required_fields',
        details: 'simulationId, stationNumber e audioRecordingId são obrigatórios'
      });
    }

    // Verificar se o áudio foi enviado
    const audioBuffer = await readBuffer(req);
    if (audioBuffer.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'no_audio_data',
        details: 'Nenhum dado de áudio foi enviado'
      });
    }

    // Buscar critérios da estação
    const supabase = getSupabaseAdmin();
    const { data: criteriaData, error: criteriaError } = await supabase
      .from('station_criteria')
      .select('id, name')
      .eq('station_id', stationNumber);

    if (criteriaError) {
      console.error('Erro ao buscar critérios:', criteriaError);
      return res.status(500).json({ 
        ok: false, 
        error: 'database_error',
        details: 'Erro ao buscar critérios da estação'
      });
    }

    const criteriaIds = criteriaData?.map(c => c.id) || [];

    // Chamar OpenAI Whisper para transcrição
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.text();
      console.error('Erro na transcrição Whisper:', errorData);
      return res.status(500).json({ 
        ok: false, 
        error: 'transcription_failed',
        details: 'Erro na API de transcrição'
      });
    }

    const transcriptionResult = await whisperResponse.json();
    const transcript = transcriptionResult.text;

    // Salvar transcrição no banco
    const { data: transcriptData, error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        simulation_id: simulationId,
        station: stationNumber,
        audio_path: `audio/${audioRecordingId}.webm`,
        transcript: transcript,
        criteria_ids: criteriaIds,
        language: 'pt',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transcriptError) {
      console.error('Erro ao salvar transcrição:', transcriptError);
      return res.status(500).json({ 
        ok: false, 
        error: 'database_error',
        details: 'Erro ao salvar transcrição no banco'
      });
    }

    return res.status(200).json({
      ok: true,
      transcript: transcript,
      transcriptId: transcriptData.id,
      criteria: criteriaData || []
    });

  } catch (error) {
    console.error('Erro na transcrição:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'internal_error',
      details: 'Erro interno do servidor'
    });
  }
}
