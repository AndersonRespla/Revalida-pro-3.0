import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../_supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, simulationId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'missing_user_id',
        details: 'userId é obrigatório'
      });
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('simulations')
      .select(`
        *,
        simulation_stations (
          *,
          stations (
            name,
            specialty
          )
        )
      `)
      .eq('user_id', userId as string);

    if (simulationId) {
      query = query.eq('id', simulationId as string);
    }

    const { data: simulations, error } = await query;

    if (error) {
      console.error('Erro ao buscar simulações:', error);
      return res.status(500).json({ 
        error: 'database_error',
        details: 'Erro ao buscar dados do banco'
      });
    }

    // Calcular métricas de performance
    const performanceData = simulations?.map(sim => {
      const totalStations = sim.simulation_stations?.length || 0;
      const completedStations = sim.simulation_stations?.filter(
        (ss: any) => ss.status === 'completed'
      ).length || 0;
      
      const avgScore = sim.simulation_stations?.reduce(
        (acc: number, ss: any) => acc + (ss.score || 0), 0
      ) / totalStations || 0;

      return {
        simulationId: sim.id,
        status: sim.status,
        totalStations,
        completedStations,
        completionRate: totalStations > 0 ? (completedStations / totalStations) * 100 : 0,
        averageScore: avgScore,
        duration: sim.duration_minutes,
        createdAt: sim.created_at
      };
    }) || [];

    return res.status(200).json({
      success: true,
      data: performanceData
    });

  } catch (error: any) {
    console.error('Erro no relatório de performance:', error);
    return res.status(500).json({ 
      error: 'internal_error',
      details: 'Erro interno do servidor'
    });
  }
}
