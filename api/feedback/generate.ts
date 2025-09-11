import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';
import { withTimeout, timeoutPresets } from '../../lib/timeout-utils';
import { circuitBreakers } from '../../lib/circuit-breaker';

interface FeedbackRequest {
  simulationId: string;
  stationNumber?: number; // Se não especificado, gera para todas as estações
}

interface CriterionScore {
  criterionId: string;
  criterionName: string;
  weight: number;
  score: number; // 0-10
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
  
  if (!apiKey) {
    throw new Error('OpenAI API key não configurada');
  }
  
  console.log('🤖 Analisando transcrição com IA...');
  
  // Construir prompt para análise
  const prompt = `
Você é um avaliador médico experiente do exame OSCE. Analise a seguinte transcrição de uma consulta médica e avalie o desempenho do candidato baseado nos critérios específicos.

INFORMAÇÕES DA ESTAÇÃO:
- Nome: ${stationInfo.name}
- Especialidade: ${stationInfo.specialty}
- Instruções ao participante: ${stationInfo.participant_info}

TRANSCRIÇÃO DA CONSULTA:
${transcript}

CRITÉRIOS DE AVALIAÇÃO:
${criteria.map((c, i) => `${i + 1}. ${c.name} (Peso: ${c.weight}%)
   Descrição: ${c.description}`).join('\n')}

Para CADA critério, forneça:
1. Uma nota de 0 a 10
2. Justificativa detalhada para a nota
3. Evidências específicas encontradas na transcrição (cite trechos)

Responda APENAS em formato JSON válido com a seguinte estrutura:
{
  "criteriaScores": [
    {
      "criterionId": "id_do_criterio",
      "score": 8.5,
      "justification": "Explicação detalhada...",
      "evidenceFound": ["trecho 1 da transcrição", "trecho 2..."]
    }
  ]
}
`;
  
  try {
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
              {
                role: 'system',
                content: 'Você é um avaliador médico especializado em OSCE. Seja objetivo, justo e baseie suas avaliações apenas no que foi observado na transcrição.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3, // Baixa temperatura para consistência
            max_tokens: 2000,
            response_format: { type: "json_object" }
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
    
    // Mapear resultado da IA para o formato esperado
    return criteria.map((criterion) => {
      const aiScore = aiAnalysis.criteriaScores.find(
        (s: any) => s.criterionId === criterion.id
      ) || {
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
    
  } catch (error) {
    console.error('Erro na análise por IA:', error);
    
    // Fallback: pontuação média para todos os critérios
    return criteria.map(criterion => ({
      criterionId: criterion.id,
      criterionName: criterion.name,
      weight: criterion.weight,
      score: 5,
      maxScore: criterion.max_score || 10,
      justification: 'Análise automática não disponível. Avaliação manual necessária.',
      evidenceFound: []
    }));
  }
}

async function generateStationFeedback(
  transcript: string,
  station: any,
  criteria: any[]
): Promise<StationFeedback> {
  console.log(`📊 Gerando feedback para estação ${station.station_order}: ${station.station.name}`);
  
  // Analisar transcrição com IA
  const criteriaScores = await analyzeTranscriptWithAI(
    transcript,
    criteria,
    station.station
  );
  
  // Calcular pontuação geral ponderada
  let weightedScore = 0;
  let totalWeight = 0;
  
  criteriaScores.forEach(score => {
    const normalizedScore = (score.score / score.maxScore) * 10; // Normalizar para base 10
    weightedScore += normalizedScore * (score.weight / 100);
    totalWeight += score.weight / 100;
  });
  
  const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  const maxPossibleScore = 10;
  const percentageScore = (overallScore / maxPossibleScore) * 100;
  
  // Identificar pontos fortes e melhorias
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  criteriaScores.forEach(score => {
    const percentage = (score.score / score.maxScore) * 100;
    
    if (percentage >= 80) {
      strengths.push(`${score.criterionName}: ${score.justification.substring(0, 100)}...`);
    } else if (percentage < 60) {
      improvements.push(`${score.criterionName}: Sugestão de melhoria baseada na avaliação.`);
    }
  });
  
  // Análises específicas
  const clinicalAccuracy = criteriaScores
    .filter(s => s.criterionName.toLowerCase().includes('diagnóstico') || 
                 s.criterionName.toLowerCase().includes('clínic'))
    .map(s => s.justification)
    .join(' ') || 'Precisão clínica adequada para o nível esperado.';
    
  const communicationSkills = criteriaScores
    .filter(s => s.criterionName.toLowerCase().includes('comunicação') || 
                 s.criterionName.toLowerCase().includes('anamnese'))
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
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { simulationId, stationNumber } = req.body as FeedbackRequest;
    
    if (!simulationId) {
      return res.status(400).json({ ok: false, error: 'missing_simulation_id' });
    }
    
    console.log(`🎯 Gerando feedback para simulação ${simulationId}`);
    if (stationNumber) {
      console.log(`📍 Estação específica: ${stationNumber}`);
    }
    
    const supabase = getSupabaseAdmin();
    
    // 1. Buscar dados da simulação com transcrições
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
      
    if (simError || !simulation) {
      return res.status(404).json({ ok: false, error: 'simulation_not_found' });
    }
    
    // 2. Filtrar estações para processar
    let stationsToProcess = simulation.simulation_stations;
    
    if (stationNumber) {
      stationsToProcess = stationsToProcess.filter(
        (s: any) => s.station_order === stationNumber
      );
    }
    
    // 3. Gerar feedback para cada estação
    const stationsFeedback: StationFeedback[] = [];
    
    for (const station of stationsToProcess) {
      // Buscar transcrição da estação
      const transcript = simulation.transcripts.find(
        (t: any) => t.station === station.station_order
      );
      
      if (!transcript) {
        console.warn(`⚠️ Transcrição não encontrada para estação ${station.station_order}`);
        continue;
      }
      
      const criteria = station.station.criteria || [];
      
      if (criteria.length === 0) {
        console.warn(`⚠️ Nenhum critério encontrado para estação ${station.station_order}`);
        continue;
      }
      
      // Gerar feedback
      const feedback = await generateStationFeedback(
        transcript.transcript,
        station,
        criteria
      );
      
      stationsFeedback.push(feedback);
      
      // Salvar feedback no banco
      await supabase
        .from('feedback')
        .upsert({
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
        
      // Atualizar transcrição como processada
      await supabase
        .from('transcripts')
        .update({
          feedback_generated: true,
          ai_analysis: {
            criteria_scores: feedback.criteriaScores,
            overall_score: feedback.overallScore
          }
        })
        .eq('simulation_id', simulationId)
        .eq('station', station.station_order);
    }
    
    // 4. Calcular feedback consolidado
    const totalScore = stationsFeedback.reduce((sum, f) => sum + f.overallScore, 0);
    const averageScore = stationsFeedback.length > 0 ? totalScore / stationsFeedback.length : 0;
    const averagePercentage = (averageScore / 10) * 100;
    
    const consolidatedFeedback = {
      simulationId,
      totalStations: stationsFeedback.length,
      averageScore: parseFloat(averageScore.toFixed(2)),
      averagePercentage: parseFloat(averagePercentage.toFixed(2)),
      stationsFeedback,
      summary: {
        strongPoints: stationsFeedback
          .flatMap(f => f.strengths)
          .filter((s, i, arr) => arr.indexOf(s) === i) // Remover duplicatas
          .slice(0, 5),
        areasForImprovement: stationsFeedback
          .flatMap(f => f.improvements)
          .filter((s, i, arr) => arr.indexOf(s) === i)
          .slice(0, 5),
        overallAssessment: averagePercentage >= 70 
          ? 'Desempenho satisfatório. Continue praticando para aprimorar suas habilidades.'
          : 'Necessita mais prática em algumas áreas. Foque nos pontos de melhoria identificados.'
      }
    };
    
    // 5. Registrar evento
    await supabase
      .from('simulation_events')
      .insert({
        simulation_id: simulationId,
        event_type: 'feedback_generated',
        event_data: {
          stations_processed: stationsFeedback.length,
          average_score: averageScore,
          generation_time_ms: Date.now()
        }
      });
    
    console.log(`✅ Feedback gerado para ${stationsFeedback.length} estações`);
    console.log(`📊 Pontuação média: ${averageScore}/10 (${averagePercentage}%)`);
    
    return res.status(200).json({
      ok: true,
      feedback: consolidatedFeedback
    });
    
  } catch (error) {
    console.error('💥 Erro ao gerar feedback:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'feedback_generation_failed',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
