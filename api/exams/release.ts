import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase.js';

interface ReleaseExamRequest {
  simulationId: string;
  stationId: string;
  stationNumber?: number;
  examName: string;
  source?: 'voice' | 'button' | 'system';
  confidence?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  try {
    const { simulationId, stationId, stationNumber, examName, source = 'system', confidence } = req.body as ReleaseExamRequest;
    
    if (!simulationId || !stationId || !examName) {
      return res.status(400).json({ ok: false, error: 'missing_params' });
    }
    
    console.log(`🧪 Liberando exame: ${examName} para estação ${stationNumber || 'N/A'}`);
    console.log(`   Fonte: ${source}, Confiança: ${confidence || 'N/A'}%`);

    const supabase = getSupabaseAdmin();

    // Registrar liberação (tabela opcional; ignore erro se não existir)
    try {
      await supabase
        .from('simulation_exams' as any)
        .insert({
          simulation_id: simulationId,
          station_id: stationId,
          exam_name: examName,
          source: source || 'system',
          released_at: new Date().toISOString(),
        });
    } catch (e) {
      console.log('simulation_exams insert skipped:', e);
    }

    // Buscar metadados do exame cadastrado na estação (CSV ou checklist)
    const { data: station, error } = await supabase
      .from('stations' as any)
      .select('id, name, available_exams, checklist')
      .eq('id', stationId)
      .single();
    if (error || !station) return res.status(404).json({ ok: false, error: 'station_not_found' });

    const fromCsv = String(station.available_exams || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .map((name: string) => ({ name, type: 'text', content: null }));

    const fromChecklist = Array.isArray(station?.checklist?.exams)
      ? station.checklist.exams.map((e: any) => ({
          name: String(e?.name || '').trim(),
          type: e?.type || 'text',
          content: e?.content || null,
          image_url: e?.image_url || null,
        }))
      : [];

    const all = [...fromCsv, ...fromChecklist];
    const found = all.find((e) => 
      e.name.toLowerCase() === String(examName).toLowerCase() ||
      e.name.toLowerCase().includes(String(examName).toLowerCase()) ||
      String(examName).toLowerCase().includes(e.name.toLowerCase())
    );

    if (!found) {
      console.warn(`⚠️ Exame "${examName}" não encontrado na lista de exames disponíveis`);
    }
    
    // Registrar evento de exame liberado
    await supabase
      .from('simulation_events')
      .insert({
        simulation_id: simulationId,
        station_number: stationNumber,
        event_type: 'exam_released',
        event_data: {
          exam_name: examName,
          exam_type: found?.type || 'text',
          source: source,
          confidence: confidence,
          has_content: !!found?.content,
          has_image: !!found?.image_url,
          station_name: station.name
        }
      });
    
    // Notificar agente sobre o exame liberado
    // Em produção, isso seria uma chamada para a API da ElevenLabs
    try {
      await fetch('/api/notify-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'exam_released',
          payload: {
            examName: found?.name || examName,
            examType: found?.type || 'text',
            content: found?.content,
            imageUrl: found?.image_url
          }
        })
      });
    } catch (error) {
      console.error('Erro ao notificar agente:', error);
    }
    
    const response = {
      ok: true,
      exam: found || { 
        name: examName,
        type: 'text',
        content: `Resultado do exame ${examName} não disponível no momento.`
      },
      metadata: {
        source,
        confidence,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log(`✅ Exame liberado com sucesso: ${examName}`);
    
    return res.status(200).json(response);
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: 'server_error', detail: String(e?.message || e) });
  }
}


