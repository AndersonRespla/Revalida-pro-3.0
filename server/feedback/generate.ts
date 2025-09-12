import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase.js';
import { withTimeout, timeoutPresets } from '../../lib/timeout-utils.js';
import { circuitBreakers } from '../../lib/circuit-breaker.js';

interface FeedbackRequest {
  simulationId: string;
  stationNumber?: number;
}

interface CriterionScore {
  criterionId: string;
  criterionName: string;
  weight: number;
  score: number;
  maxScore: number;
  justification: string;
  evidenceFound: string[];
}

interface StationFeedback {
  stationNumber: number;
  stationName: string;
  specialty: string;
  overallScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  criteriaScores: CriterionScore[];
  strengths: string[];
  improvements: string[];
  clinicalAccuracy: string;
  communicationSkills: string;
}

async function analyzeTranscriptWithAI(
  transcript: string,
  criteria: any[],
  stationInfo: any
): Promise<CriterionScore[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key não configurada');

  const response = await circuitBreakers.openai.execute(async () => {
    return withTimeout(
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: 'Você é um avaliador médico especializado em OSCE. Seja objetivo, justo e baseie suas avaliações apenas no que foi observado na transcrição.' },
            { role: 'user', content: `\nVocê é um avaliador médico experiente do exame OSCE. Analise a seguinte transcrição de uma consulta médica e avalie o desempenho do candidato baseado nos critérios específicos.\n\nINFORMAÇÕES DA ESTAÇÃO:\n- Nome: ${stationInfo.name}\n- Especialidade: ${stationInfo.specialty}\n- Instruções ao participante: ${stationInfo.participant_info}\n\nTRANSCRIÇÃO DA CONSULTA:\n${transcript}\n\nCRITÉRIOS DE AVALIAÇÃO:\n${criteria.map((c, i) => `${i + 1}. ${c.name} (Peso: ${c.weight}%)\n   Descrição: ${c.description}`).join('\n')}\n\nResponda APENAS em formato JSON válido com a seguinte estrutura:\n{\n  "criteriaScores": [\n    {\n      "criterionId": "id_do_criterio",\n      "score": 8.5,\n      "justification": "Explicação detalhada...",\n      "evidenceFound": ["trecho 1 da transcrição", "trecho 2..."]\n    }\n  ]\n}\n` }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      }),
      timeoutPresets.feedbackGeneration
    );
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API OpenAI: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const aiAnalysis = JSON.parse(result.choices[0].message.content);

  return criteria.map((criterion) => {
    const aiScore = aiAnalysis.criteriaScores.find((s: any) => s.criterionId === criterion.id) || {
      score: 5,
      justification: 'Não foi possível avaliar este critério com base na transcrição.',
      evidenceFound: []
    };
    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      weight: criterion.weight,
      score: Math.min(10, Math.max(0, aiScore.score)),
      maxScore: criterion.max_score || 10,
      justification: aiScore.justification,
      evidenceFound: aiScore.evidenceFound || []
    };
  });
}

async function generateStationFeedback(
  transcript: string,
  station: any,
  criteria: any[]
): Promise<StationFeedback> {
  const criteriaScores = await analyzeTranscriptWithAI(transcript, criteria, station.station);

  let weightedScore = 0;
  let totalWeight = 0;
  criteriaScores.forEach(score => {
    const normalizedScore = (score.score / score.maxScore) * 10;
    weightedScore += normalizedScore * (score.weight / 100);
    totalWeight += score.weight / 100;
  });
  const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  const maxPossibleScore = 10;
  const percentageScore = (overallScore / maxPossibleScore) * 100;

  const strengths: string[] = [];
  const improvements: string[] = [];
  criteriaScores.forEach(s => {
    const percentage = (s.score / s.maxScore) * 100;
    if (percentage >= 80) strengths.push(`${s.criterionName}: ${s.justification.substring(0, 100)}...`);
    else if (percentage < 60) improvements.push(`${s.criterionName}: Sugestão de melhoria baseada na avaliação.`);
  });

  const clinicalAccuracy = criteriaScores
    .filter(s => s.criterionName.toLowerCase().includes('diagnóstico') || s.criterionName.toLowerCase().includes('clínic'))
    .map(s => s.justification)
    .join(' ') || 'Precisão clínica adequada para o nível esperado.';

  const communicationSkills = criteriaScores
    .filter(s => s.criterionName.toLowerCase().includes('comunicação') || s.criterionName.toLowerCase().includes('anamnese'))
    .map(s => s.justification)
    .join(' ') || 'Comunicação clara e empática com o paciente.';

  return {
    stationNumber: station.station_order,
    stationName: station.station.name,
    specialty: station.station.specialty,
    overallScore: parseFloat(overallScore.toFixed(2)),
    maxPossibleScore,
    percentageScore: parseFloat(percentageScore.toFixed(2)),
    criteriaScores,
    strengths,
    improvements,
    clinicalAccuracy,
    communicationSkills
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  try {
    const { simulationId, stationNumber } = req.body as FeedbackRequest;
    if (!simulationId) return res.status(400).json({ ok: false, error: 'missing_simulation_id' });

    const supabase = getSupabaseAdmin();
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select(`
        *,
        simulation_stations (
          *,
          station:stations!station_id (
            *,
            criteria:station_criteria (*)
          )
        ),
        transcripts (*)
      `)
      .eq('id', simulationId)
      .single();
    if (simError || !simulation) return res.status(404).json({ ok: false, error: 'simulation_not_found' });

    let stationsToProcess = simulation.simulation_stations;
    if (stationNumber) stationsToProcess = stationsToProcess.filter((s: any) => s.station_order === stationNumber);

    const stationsFeedback: StationFeedback[] = [];
    for (const station of stationsToProcess) {
      const transcript = simulation.transcripts.find((t: any) => t.station === station.station_order);
      if (!transcript) continue;
      const criteria = station.station.criteria || [];
      if (criteria.length === 0) continue;

      const feedback = await generateStationFeedback(transcript.transcript, station, criteria);
      stationsFeedback.push(feedback);

      await supabase.from('feedback').upsert({
        simulation_id: simulationId,
        station_number: station.station_order,
        overall_score: feedback.overallScore,
        percentage_score: feedback.percentageScore,
        criteria_scores: feedback.criteriaScores,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        clinical_accuracy: feedback.clinicalAccuracy,
        communication_skills: feedback.communicationSkills,
        generated_at: new Date().toISOString()
      });

      await supabase.from('transcripts').update({
        feedback_generated: true,
        ai_analysis: { criteria_scores: feedback.criteriaScores, overall_score: feedback.overallScore }
      }).eq('simulation_id', simulationId).eq('station', station.station_order);
    }

    const totalScore = stationsFeedback.reduce((sum, f) => sum + f.overallScore, 0);
    const averageScore = stationsFeedback.length > 0 ? totalScore / stationsFeedback.length : 0;
    const averagePercentage = (averageScore / 10) * 100;

    await supabase.from('simulation_events').insert({
      simulation_id: simulationId,
      event_type: 'feedback_generated',
      event_data: { stations_processed: stationsFeedback.length, average_score: averageScore, generation_time_ms: Date.now() }
    });

    return res.status(200).json({
      ok: true,
      feedback: {
        simulationId,
        totalStations: stationsFeedback.length,
        averageScore: parseFloat(averageScore.toFixed(2)),
        averagePercentage: parseFloat(averagePercentage.toFixed(2)),
        stationsFeedback
      }
    });
  } catch (error) {
    console.error('💥 Erro ao gerar feedback:', error);
    return res.status(500).json({ ok: false, error: 'feedback_generation_failed', message: error instanceof Error ? error.message : 'Erro desconhecido' });
  }
}


