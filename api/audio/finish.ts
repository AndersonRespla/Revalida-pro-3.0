import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recordingId } = req.body;

    if (!recordingId) {
      return res.status(400).json({ error: 'Missing recordingId' });
    }

    const supabase = getSupabaseAdmin();

    // Atualizar status da gravação
    const { error: updateError } = await supabase
      .from('audio_recordings')
      .update({ 
        status: 'processing',
        finished_at: new Date().toISOString()
      })
      .eq('id', recordingId);

    if (updateError) {
      console.error('Error updating recording:', updateError);
      return res.status(500).json({ error: 'Failed to update recording' });
    }

    // Buscar chunks da gravação
    const { data: chunks, error: listError } = await supabase.storage
      .from('audio-chunks')
      .list(recordingId);

    if (listError) {
      console.error('Error listing chunks:', listError);
      return res.status(500).json({ error: 'Failed to list chunks' });
    }

    // Combinar chunks em um único arquivo
    const audioChunks: Buffer[] = [];
    
    for (const chunk of chunks) {
      const { data: chunkData, error: downloadError } = await supabase.storage
        .from('audio-chunks')
        .download(`${recordingId}/${chunk.name}`);

      if (downloadError) {
        console.error('Error downloading chunk:', downloadError);
        continue;
      }

      const buffer = Buffer.from(await chunkData.arrayBuffer());
      audioChunks.push(buffer);
    }

    if (audioChunks.length === 0) {
      return res.status(400).json({ error: 'No audio chunks found' });
    }

    // Combinar chunks
    const combinedAudio = Buffer.concat(audioChunks);

    // Fazer upload do arquivo final
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(`${recordingId}/audio.webm`, combinedAudio, {
        contentType: 'audio/webm',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Error uploading final audio:', uploadError);
      return res.status(500).json({ error: 'Failed to upload final audio' });
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('recordings')
      .getPublicUrl(uploadData.path);

    // Atualizar gravação com URL final
    await supabase
      .from('audio_recordings')
      .update({ 
        audio_url: publicUrl,
        status: 'ready_for_transcription'
      })
      .eq('id', recordingId);

    // Limpar chunks temporários
    await supabase.storage
      .from('audio-chunks')
      .remove([`${recordingId}/`]);

    // Chamar transcrição
    const transcriptionResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        recordingId,
        audioUrl: publicUrl
      })
    });

    const transcriptionResult = await transcriptionResponse.json();

    if (transcriptionResult.ok) {
      // Atualizar com transcrição
      await supabase
        .from('audio_recordings')
        .update({ 
          status: 'transcribed',
          transcript: transcriptionResult.transcript
        })
        .eq('id', recordingId);

      // Gerar feedback se necessário
      if (transcriptionResult.transcript) {
        const feedbackResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            simulationId: recordingId,
            transcripts: { [1]: transcriptionResult.transcript }
          })
        });

        const feedbackResult = await feedbackResponse.json();

        if (feedbackResult.ok) {
          await supabase
            .from('audio_recordings')
            .update({ 
              status: 'completed',
              feedback: feedbackResult.feedbackHtml
            })
            .eq('id', recordingId);
        }
      }
    }

    return res.status(200).json({ 
      ok: true, 
      transcript: transcriptionResult.transcript,
      feedback: transcriptionResult.feedback
    });

  } catch (error) {
    console.error('Error in audio/finish:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
