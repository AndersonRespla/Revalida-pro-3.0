import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';

interface StationData {
  id: string;
  name: string;
  specialty: string;
  code: string;
  participant_info: string;
  actor_info: string;
  available_exams: string;
  is_active: boolean;
  difficulty_level: string;
  estimated_duration: number;
  created_by: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

interface SimulationLoadResponse {
  ok: boolean;
  simulationId: string;
  stations: StationData[];
  simulation: {
    id: string;
    status: string;
    total_stations: number;
    current_station: number;
    created_at: string;
  };
  message?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { simulationId } = req.query;
    
    if (!simulationId || typeof simulationId !== 'string') {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_simulation_id',
        message: 'ID da simulação é obrigatório'
      });
    }

    console.log('📋 Carregando simulação existente:', simulationId);
    
    const supabase = getSupabaseAdmin();

    // 1. Buscar dados da simulação
    const { data: simulation, error: simulationError } = await supabase
      .from('simulations')
      .select(`
        id,
        status,
        total_stations,
        current_station,
        created_at
      `)
      .eq('id', simulationId)
      .single();

    if (simulationError || !simulation) {
      return res.status(404).json({
        ok: false,
        error: 'simulation_not_found',
        message: 'Simulação não encontrada'
      });
    }

    // 2. Buscar estações da simulação
    const { data: simulationStations, error: stationsError } = await supabase
      .from('simulation_stations')
      .select(`
        station_order,
        station_id,
        stations (
          id,
          name,
          specialty,
          code,
          participant_info,
          actor_info,
          available_exams,
          is_active,
          difficulty_level,
          estimated_duration,
          created_by,
          tags,
          created_at,
          updated_at
        )
      `)
      .eq('simulation_id', simulationId)
      .order('station_order');

    if (stationsError) {
      throw new Error(`Erro ao buscar estações: ${stationsError.message}`);
    }

    if (!simulationStations || simulationStations.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'stations_not_found',
        message: 'Estações da simulação não encontradas'
      });
    }

    // 3. Mapear estações na ordem correta
    const stations = simulationStations
      .map((item: any) => item.stations)
      .filter(Boolean) as StationData[];

    console.log(`✅ Simulação carregada: ${simulation.id}`);
    console.log(`📊 Estações: ${stations.map(s => `${s.code} - ${s.name}`).join(' → ')}`);

    // 4. Preparar resposta
    const response: SimulationLoadResponse = {
      ok: true,
      simulationId: simulation.id,
      stations,
      simulation: {
        id: simulation.id,
        status: simulation.status,
        total_stations: simulation.total_stations,
        current_station: simulation.current_station,
        created_at: simulation.created_at
      },
      message: `Simulação carregada com ${stations.length} estações`
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('💥 Erro ao carregar simulação:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'simulation_load_failed',
      message: error instanceof Error ? error.message : 'Erro desconhecido ao carregar simulação',
      timestamp: new Date().toISOString()
    });
  }
}
