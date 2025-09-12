import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase.js';

const EXAM_NORMALIZATIONS: Record<string, string[]> = {
  'ecg': ['eletrocardiograma', 'eletro', 'e.c.g.', 'ecg de 12 derivações', 'eletro de 12 derivações'],
  'rx de tórax': ['raio x de tórax', 'raio x', 'rx', 'radiografia de tórax', 'radiografia torácica', 'rx torácico'],
  'hemograma': ['hemograma completo', 'hemograma com diferencial', 'hemo', 'exame de sangue'],
  'glicemia': ['glicemia de jejum', 'glicose', 'açúcar no sangue', 'glicemia capilar'],
  'gasometria': ['gasometria arterial', 'gases arteriais', 'gaso', 'gasometria'],
  'urina': ['exame de urina', 'eas', 'urina tipo 1', 'urina rotina', 'sumário de urina'],
  'tomografia': ['tc', 'tomografia computadorizada', 'tomo', 'ct scan'],
  'ultrassom': ['ultrassonografia', 'usg', 'ecografia', 'eco'],
  'troponina': ['troponina i', 'troponina t', 'enzimas cardíacas', 'marcadores cardíacos'],
  'pcr': ['proteína c reativa', 'proteína c-reativa', 'pcr'],
  'vhs': ['velocidade de hemossedimentação', 'velocidade de sedimentação', 'vhs'],
  'função renal': ['ureia', 'creatinina', 'ureia e creatinina', 'função dos rins'],
  'função hepática': ['tgo', 'tgp', 'transaminases', 'enzimas hepáticas', 'função do fígado'],
  'lipidograma': ['colesterol', 'triglicerídeos', 'perfil lipídico', 'gorduras no sangue']
};

function normalize(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-z0-9\s\-\/_\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeExamName(text: string): string {
  const normalized = normalize(text);
  for (const [standard, variations] of Object.entries(EXAM_NORMALIZATIONS)) {
    const standardNorm = normalize(standard);
    if (normalized === standardNorm) return standard;
    for (const variation of variations) {
      const variationNorm = normalize(variation);
      if (normalized === variationNorm || normalized.includes(variationNorm) || variationNorm.includes(normalized)) {
        return standard;
      }
    }
  }
  return text;
}

async function readBuffer(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const bufs: Buffer[] = [];
    req.on('data', (c: any) => bufs.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(bufs)));
    req.on('error', reject);
  });
}

function extractRequestedAfterSolicito(transcript: string): string | null {
  const lower = transcript.toLowerCase();
  const solicitoVariations = ['solicito', 'solicitar', 'quero', 'preciso', 'gostaria de', 'pode fazer', 'favor fazer'];
  let lastIndex = -1;
  let matchedVariation = '';
  for (const variation of solicitoVariations) {
    const idx = lower.lastIndexOf(variation);
    if (idx > lastIndex) { lastIndex = idx; matchedVariation = variation; }
  }
  if (lastIndex < 0) return null;
  const tail = transcript.slice(lastIndex + matchedVariation.length)
    .replace(/^[::\-\s]+/, '')
    .replace(/[.,!?]+$/, '')
    .trim();
  return tail || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
    if (!apiKey) return res.status(500).json({ ok: false, error: 'missing_openai_key' });

    const stationId = String((req.query as any).stationId || '');
    const simulationId = String((req.query as any).simulationId || '');
    if (!stationId) return res.status(400).json({ ok: false, error: 'missing_stationId' });

    const audioBuffer = await readBuffer(req);

    const form = new FormData();
    const blob = new Blob([audioBuffer], { type: req.headers['content-type'] || 'audio/webm' });
    form.append('file', blob, 'chunk.webm');
    form.append('model', 'whisper-1');

    const tr = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form as any });
    if (!tr.ok) {
      const detail = await tr.text();
      return res.status(200).json({ ok: true, detected: false, transcript_error: detail });
    }
    const tj: any = await tr.json();
    const transcript: string = String(tj?.text || '');

    const afterSolicito = extractRequestedAfterSolicito(transcript);
    if (!afterSolicito) return res.status(200).json({ ok: true, detected: false, transcript });

    const supabase = getSupabaseAdmin();
    const { data: station, error } = await supabase
      .from('stations' as any)
      .select('id, name, available_exams, checklist')
      .eq('id', stationId)
      .single();
    if (error || !station) return res.status(404).json({ ok: false, error: 'station_not_found' });

    const examsFromCsv: string[] = String(station.available_exams || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const examsFromChecklist: string[] = Array.isArray(station?.checklist?.exams) ? station.checklist.exams.map((e: any) => String(e?.name || e).trim()).filter(Boolean) : [];
    const availableNames: string[] = Array.from(new Set([...examsFromCsv, ...examsFromChecklist]));
    if (availableNames.length === 0) {
      return res.status(200).json({ ok: true, detected: true, matched: false, transcript, requested: afterSolicito });
    }

    const requestedNormalized = normalizeExamName(afterSolicito);
    const requestedNorm = normalize(requestedNormalized);
    let matchedName = '';
    let matchConfidence = 0;
    for (const name of availableNames) {
      const examNormalized = normalizeExamName(name);
      const examNorm = normalize(examNormalized);
      if (examNorm === requestedNorm) { matchedName = name; matchConfidence = 100; break; }
      if (examNorm.includes(requestedNorm) || requestedNorm.includes(examNorm)) {
        const similarity = Math.min(requestedNorm.length, examNorm.length) / Math.max(requestedNorm.length, examNorm.length) * 100;
        if (similarity > matchConfidence) { matchedName = name; matchConfidence = similarity; }
      }
    }

    if (!matchedName) {
      if (simulationId) {
        await supabase.from('simulation_events').insert({
          simulation_id: simulationId,
          station_number: parseInt((req.query as any).stationNumber as string) || null,
          event_type: 'voice_command_detected',
          event_data: { command: afterSolicito, normalized: requestedNormalized, matched: false, available_exams: availableNames }
        });
      }
      return res.status(200).json({ ok: true, detected: true, matched: false, transcript, requested: afterSolicito, requestedNormalized, available: availableNames, suggestion: availableNames[0] });
    }

    if (simulationId) {
      try {
        await supabase.from('simulation_exams' as any).insert({
          simulation_id: simulationId,
          station_id: stationId,
          exam_name: matchedName,
          source: 'voice',
          confidence: matchConfidence,
          original_request: afterSolicito,
          released_at: new Date().toISOString(),
        });
      } catch {}
      await supabase.from('simulation_events').insert({
        simulation_id: simulationId,
        station_number: parseInt((req.query as any).stationNumber as string) || null,
        event_type: 'exam_requested',
        event_data: { exam: matchedName, source: 'voice', confidence: matchConfidence, original_request: afterSolicito, normalized_request: requestedNormalized }
      });
      await supabase.from('simulation_events').insert({
        simulation_id: simulationId,
        station_number: parseInt((req.query as any).stationNumber as string) || null,
        event_type: 'exam_released',
        event_data: { exam: matchedName, released_to_agent: true }
      });
    }

    return res.status(200).json({ ok: true, detected: true, matched: true, transcript, examName: matchedName, confidence: matchConfidence, originalRequest: afterSolicito, normalizedRequest: requestedNormalized });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: 'server_error', detail: String(e?.message || e) });
  }
}


