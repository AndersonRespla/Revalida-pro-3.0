import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  try {
    const { simulationId, stationNumber } = req.query as { simulationId?: string; stationNumber?: string };
    if (!simulationId) return res.status(400).json({ ok: false, error: 'missing_simulation_id' });

    const supabase = getSupabaseAdmin();
    if (stationNumber) {
      const { data: feedback, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('simulation_id', simulationId)
        .eq('station_number', parseInt(stationNumber))
        .single();
      if (error) {
        if ((error as any).code === 'PGRST116') {
          return res.status(404).json({ ok: false, error: 'feedback_not_found', message: 'Feedback ainda não foi gerado para esta estação' });
        }
        throw error;
      }
      return res.status(200).json({ ok: true, feedback });
    } else {
      const { data: feedbacks, error: feedbacksError } = await supabase
        .from('feedback')
        .select('*')
        .eq('simulation_id', simulationId)
        .order('station_number');
      if (feedbacksError) throw feedbacksError;
      if (!feedbacks || feedbacks.length === 0) {
        return res.status(404).json({ ok: false, error: 'no_feedback_found', message: 'Nenhum feedback foi gerado para esta simulação ainda' });
      }
      const { data: summary } = await supabase
        .from('simulation_feedback_summary')
        .select('*')
        .eq('simulation_id', simulationId)
        .single();

      const consolidatedFeedback = {
        simulationId,
        totalStations: feedbacks.length,
        averageScore: summary?.average_score || 0,
        averagePercentage: summary?.average_percentage || 0,
        minScore: summary?.min_score || 0,
        maxScore: summary?.max_score || 0,
        stationsFeedback: feedbacks.map(f => ({
          stationNumber: f.station_number,
          overallScore: f.overall_score,
          percentageScore: f.percentage_score,
          criteriaScores: f.criteria_scores,
          strengths: f.strengths,
          improvements: f.improvements,
          clinicalAccuracy: f.clinical_accuracy,
          communicationSkills: f.communication_skills,
          generatedAt: f.generated_at
        })),
        summary: {
          strongPoints: summary?.all_strengths?.slice(0, 5) || [],
          areasForImprovement: summary?.all_improvements?.slice(0, 5) || [],
          overallAssessment: (summary?.average_percentage || 0) >= 70 ?
            'Desempenho satisfatório. Continue praticando para aprimorar suas habilidades.' :
            'Necessita mais prática em algumas áreas. Foque nos pontos de melhoria identificados.'
        }
      };

      return res.status(200).json({ ok: true, feedback: consolidatedFeedback });
    }
  } catch (error) {
    console.error('💥 Erro ao buscar feedback:', error);
    return res.status(500).json({ ok: false, error: 'feedback_retrieval_failed', message: error instanceof Error ? error.message : 'Erro desconhecido' });
  }
}


