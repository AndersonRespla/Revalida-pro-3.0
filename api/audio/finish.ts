import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';
import { withTimeout, timeoutPresets } from '../../lib/timeout-utils';
import { circuitBreakers } from '../../lib/circuit-breaker';

interface FinishRequest {
  recordingId: string;
}

interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

async function consolidateAudioChunks(
  supabase: any,
  recordingId: string
): Promise<{ audioBuffer: Buffer; chunksCount: number }> {
  console.log(`🎵 Consolidando chunks de áudio para gravação ${recordingId}`);
  
  // Listar todos os chunks
  const { data: files, error: listError } = await supabase.storage
    .from('audio-chunks')
    .list(recordingId, {
      sortBy: { column: 'created_at', order: 'asc' }
    });
    
  if (listError || !files || files.length === 0) {
    throw new Error('Nenhum chunk de áudio encontrado');
  }
  
  console.log(`📦 ${files.length} chunks encontrados`);
  
  // Baixar e concatenar chunks
  const chunks: Buffer[] = [];
  
  for (const file of files) {
    const { data, error } = await supabase.storage
      .from('audio-chunks')
      .download(`${recordingId}/${file.name}`);
      
    if (error) {
      console.error(`Erro ao baixar chunk ${file.name}:`, error);
      continue;
    }
    
    const buffer = Buffer.from(await data.arrayBuffer());
    chunks.push(buffer);
  }
  
  // Concatenar todos os buffers
  const audioBuffer = Buffer.concat(chunks);
  
  console.log(`✅ Audio consolidado: ${audioBuffer.length} bytes`);
  
  return { audioBuffer, chunksCount: files.length };
}

async function transcribeAudio(
  audioBuffer: Buffer,
  language: string = 'pt'
): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key não configurada');
  }
  
  console.log('🎤 Iniciando transcrição com Whisper...');
  
  // Criar FormData para a API do Whisper
  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: 'audio/webm' });
  form.append('file', blob, 'audio.webm');
  form.append('model', 'whisper-1');
  form.append('language', language);
  form.append('response_format', 'verbose_json'); // Para obter detalhes adicionais
  
  // Usar circuit breaker e timeout para a chamada
  const response = await circuitBreakers.openai.execute(async () => {
    return withTimeout(
      fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${apiKey}`
        },
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
  
  console.log('✅ Transcrição concluída');
  
  return {
    text: result.text || '',
    language: result.language || language,
    duration: result.duration
  };
}

async function extractKeywords(transcript: string, criteria: any[]): Promise<string[]> {
  // Extrair palavras-chave relevantes baseadas nos critérios
  const keywords: Set<string> = new Set();
  
  // Palavras-chave médicas comuns
  const medicalTerms = [
    'dor', 'febre', 'tosse', 'dispneia', 'náusea', 'vômito',
    'cefaleia', 'tontura', 'fraqueza', 'edema', 'icterícia',
    'hipertensão', 'diabetes', 'alergia', 'medicamento'
  ];
  
  // Adicionar termos dos critérios
  criteria.forEach(criterion => {
    const terms = criterion.name.toLowerCase().split(' ');
    terms.forEach(term => {
      if (term.length > 3) keywords.add(term);
    });
  });
  
  // Buscar termos no transcript
  const transcriptLower = transcript.toLowerCase();
  medicalTerms.forEach(term => {
    if (transcriptLower.includes(term)) {
      keywords.add(term);
    }
  });
  
  return Array.from(keywords);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { recordingId } = req.body as FinishRequest;
    
    if (!recordingId) {
      return res.status(400).json({ ok: false, error: 'missing_recording_id' });
    }
    
    console.log(`🏁 Finalizando gravação ${recordingId}`);
    
    const supabase = getSupabaseAdmin();
    
    // 1. Buscar informações da gravação
    const { data: recording, error: recordingError } = await supabase
      .from('audio_recordings')
      .select(`
        *,
        simulation:simulations!simulation_id (
          *,
          simulation_stations (
            *,
            station:stations!station_id (
              *,
              criteria:station_criteria (*)
            )
          )
        )
      `)
      .eq('id', recordingId)
      .single();
      
    if (recordingError || !recording) {
      return res.status(404).json({ ok: false, error: 'recording_not_found' });
    }
    
    if (recording.status !== 'recording') {
      return res.status(400).json({ ok: false, error: 'recording_not_active' });
    }
    
    // 2. Atualizar status para processamento
    await supabase
      .from('audio_recordings')
      .update({ 
        status: 'processing',
        finished_at: new Date().toISOString()
      })
      .eq('id', recordingId);
    
    // 3. Consolidar chunks de áudio
    let audioBuffer: Buffer;
    let chunksCount: number;
    
    try {
      const result = await consolidateAudioChunks(supabase, recordingId);
      audioBuffer = result.audioBuffer;
      chunksCount = result.chunksCount;
    } catch (error) {
      console.error('Erro ao consolidar áudio:', error);
      
      await supabase
        .from('audio_recordings')
        .update({ 
          status: 'error',
          metadata: { error: 'consolidation_failed' }
        })
        .eq('id', recordingId);
        
      throw error;
    }
    
    // 4. Salvar áudio consolidado
    const audioPath = `consolidated/${recording.simulation_id}/station-${recording.station}-${Date.now()}.webm`;
    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(audioPath, audioBuffer, {
        contentType: 'audio/webm',
        cacheControl: '3600'
      });
      
    if (uploadError) {
      console.error('Erro ao salvar áudio consolidado:', uploadError);
      throw uploadError;
    }
    
    // 5. Transcrever áudio
    let transcription: TranscriptionResult;
    
    try {
      await supabase
        .from('audio_recordings')
        .update({ 
          status: 'ready_for_transcription',
          audio_url: audioPath,
          chunks_count: chunksCount,
          file_size_bytes: audioBuffer.length
        })
        .eq('id', recordingId);
        
      transcription = await transcribeAudio(audioBuffer);
      
    } catch (error) {
      console.error('Erro na transcrição:', error);
      
      await supabase
        .from('audio_recordings')
        .update({ 
          status: 'error',
          metadata: { error: 'transcription_failed' }
        })
        .eq('id', recordingId);
        
      throw error;
    }
    
    // 6. Buscar critérios da estação atual
    const currentStation = recording.simulation?.simulation_stations?.find(
      (s: any) => s.station_order === recording.station
    );
    
    const criteria = currentStation?.station?.criteria || [];
    
    // 7. Extrair palavras-chave baseadas nos critérios
    const keywords = await extractKeywords(transcription.text, criteria);
    
    // 8. Salvar transcrição vinculada aos critérios
    const { error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        simulation_id: recording.simulation_id,
        station: recording.station,
        transcript: transcription.text,
        audio_path: audioPath,
        language: transcription.language,
        duration_seconds: transcription.duration,
        keywords: keywords,
        criteria_ids: criteria.map((c: any) => c.id),
        recording_id: recordingId,
        created_at: new Date().toISOString()
      });
      
    if (transcriptError) {
      console.error('Erro ao salvar transcrição:', transcriptError);
      // Não vamos falhar aqui, apenas logar
    }
    
    // 9. Atualizar gravação como concluída
    await supabase
      .from('audio_recordings')
      .update({ 
        status: 'transcribed',
        transcript: transcription.text,
        duration_seconds: transcription.duration,
        metadata: {
          language: transcription.language,
          keywords: keywords,
          criteria_count: criteria.length
        }
      })
      .eq('id', recordingId);
    
    // 10. Registrar evento
    await supabase
      .from('simulation_events')
      .insert({
        simulation_id: recording.simulation_id,
        station_number: recording.station,
        event_type: 'transcription_completed',
        event_data: {
          recording_id: recordingId,
          transcript_length: transcription.text.length,
          keywords_count: keywords.length,
          duration_seconds: transcription.duration
        }
      });
    
    // 11. Limpar chunks temporários
    try {
      const { data: chunks } = await supabase.storage
        .from('audio-chunks')
        .list(recordingId);
        
      if (chunks && chunks.length > 0) {
        const filesToDelete = chunks.map(f => `${recordingId}/${f.name}`);
        await supabase.storage
          .from('audio-chunks')
          .remove(filesToDelete);
      }
    } catch (error) {
      console.error('Erro ao limpar chunks:', error);
      // Não falhar se não conseguir limpar
    }
    
    console.log(`✅ Gravação ${recordingId} finalizada com sucesso`);
    console.log(`📝 Transcrição: ${transcription.text.length} caracteres`);
    console.log(`🏷️ Keywords: ${keywords.join(', ')}`);
    
    return res.status(200).json({
      ok: true,
      recordingId,
      transcript: transcription.text,
      keywords,
      audioPath,
      duration: transcription.duration,
      criteria: criteria.map((c: any) => ({
        id: c.id,
        name: c.name,
        weight: c.weight
      }))
    });
    
  } catch (error) {
    console.error('💥 Erro ao finalizar gravação:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'recording_finish_failed',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
