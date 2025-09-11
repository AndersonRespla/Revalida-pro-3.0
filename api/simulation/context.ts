import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';

interface StationContext {
  station_number: number;
  station_id: string;
  target_agent_id: string;
  specialty: string;
  criteria: {
    name: string;
    description: string;
    weight: number;
  }[];
  actor_instructions: string;
  available_exams: string;
}

interface ModeratorContext {
  simulation_id: string;
  total_stations: number;
  stations: StationContext[];
  moderator_instructions: string;
}

// Mapeamento de agentes por especialidade
// Em produção, estes IDs viriam de variáveis de ambiente
const AGENT_MAPPING: Record<string, string> = {
  'Cardiologia': 'agent_patient_card_001',
  'Pneumologia': 'agent_patient_pneu_001',
  'Gastroenterologia': 'agent_patient_gast_001',
  'Neurologia': 'agent_patient_neuro_001',
  'Endocrinologia': 'agent_patient_endo_001',
  'Ortopedia': 'agent_patient_orto_001',
  'Pediatria': 'agent_patient_ped_001',
  'Ginecologia': 'agent_patient_gine_001',
  // Agente padrão para especialidades não mapeadas
  'default': 'agent_patient_general_001'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { simulationId } = req.body;
    
    if (!simulationId) {
      return res.status(400).json({ ok: false, error: 'missing_simulation_id' });
    }
    
    console.log('🧠 Gerando contexto privado para simulação:', simulationId);
    
    const supabase = getSupabaseAdmin();
    
    // Buscar dados da simulação e estações
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
        )
      `)
      .eq('id', simulationId)
      .single();
    
    if (simError || !simulation) {
      throw new Error('Simulação não encontrada');
    }
    
    // Construir contexto privado para o moderador
    const stationContexts: StationContext[] = simulation.simulation_stations
      .sort((a: any, b: any) => a.station_order - b.station_order)
      .map((simStation: any) => {
        const station = simStation.station;
        const targetAgentId = AGENT_MAPPING[station.specialty] || AGENT_MAPPING.default;
        
        return {
          station_number: simStation.station_order,
          station_id: station.id,
          target_agent_id: targetAgentId,
          specialty: station.specialty,
          criteria: station.criteria?.map((c: any) => ({
            name: c.name,
            description: c.description,
            weight: c.weight
          })) || [],
          actor_instructions: station.actor_info,
          available_exams: station.available_exams
        };
      });
    
    const moderatorContext: ModeratorContext = {
      simulation_id: simulationId,
      total_stations: simulation.total_stations,
      stations: stationContexts,
      moderator_instructions: `
        Você é o moderador de uma simulação OSCE médica com ${simulation.total_stations} estações.
        
        INSTRUÇÕES IMPORTANTES:
        1. NUNCA revele detalhes das estações ao candidato
        2. Para cada estação, faça o handoff para o agente correspondente usando o target_agent_id
        3. Monitore o tempo (10 minutos por estação)
        4. Aos 8 minutos, avise que restam 2 minutos
        5. Ao final de cada estação, retome o controle e prepare a próxima
        6. Mantenha um tom profissional e encorajador
        
        FLUXO DE HANDOFF:
        - Estação 1: Transferir para ${stationContexts[0]?.target_agent_id}
        - Estação 2: Transferir para ${stationContexts[1]?.target_agent_id}
        - Estação 3: Transferir para ${stationContexts[2]?.target_agent_id}
        - Estação 4: Transferir para ${stationContexts[3]?.target_agent_id}
        - Estação 5: Transferir para ${stationContexts[4]?.target_agent_id}
        
        CONTEXTO PRIVADO DAS ESTAÇÕES:
        ${JSON.stringify(stationContexts, null, 2)}
      `
    };
    
    console.log('✅ Contexto privado gerado com sucesso');
    console.log(`📊 Total de estações: ${stationContexts.length}`);
    console.log(`🎯 Mapeamento de agentes:`, stationContexts.map(s => `${s.specialty} → ${s.target_agent_id}`));
    
    return res.status(200).json({
      ok: true,
      context: moderatorContext,
      // Retornar contexto público (sem detalhes sensíveis) para o frontend
      publicContext: {
        simulation_id: simulationId,
        total_stations: simulation.total_stations,
        stations: stationContexts.map(s => ({
          station_number: s.station_number,
          specialty: s.specialty
        }))
      }
    });
    
  } catch (error) {
    console.error('💥 Erro ao gerar contexto:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'context_generation_failed',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
