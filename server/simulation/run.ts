import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase.js';
import { withTimeout, timeoutPresets } from '../../lib/timeout-utils.js';
import { circuitBreakers } from '../../lib/circuit-breaker.js';

interface StationCriteria {
	id: string;
	name: string;
	description: string;
	weight: number;
	order_index: number;
	is_required: boolean;
	max_score: number;
}

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
	criteria: StationCriteria[];
}

interface SimulationRequest {
	seed?: string;
	specialty_quota?: Record<string, number>;
}

interface SimulationResponse {
	ok: boolean;
	simulationId: string;
	stations: StationData[];
	metadata?: {
		seed?: string;
		specialty_distribution?: Record<string, number>;
	};
	message?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ ok: false, error: 'method_not_allowed' });
	}

	try {
		const { seed } = req.body as SimulationRequest;

		console.log('🎯 Iniciando criação de simulação com 5 estações');
		if (seed) console.log(`🎲 Usando seed: ${seed}`);

		const supabase = getSupabaseAdmin();

		// Gerar ID da simulação
		const timestamp = Date.now();
		const randomSuffix = seed
			? seed.split('')
					.reduce((acc, char) => acc + char.charCodeAt(0), 0)
					.toString(36)
			: Math.random().toString(36).substr(2, 9);

		const simulationId = `sim_${timestamp}_${randomSuffix}`;

		// 1. Buscar todas as estações ativas com critérios (corrigindo tipagem/await)
		console.log('🔍 Buscando estações ativas com critérios...');
		const stationsResult = await withTimeout(
			circuitBreakers.supabase.execute(async () => {
				return await supabase.from('stations_with_criteria' as any).select('*');
			}),
			timeoutPresets.database
		);

		const allStations = (stationsResult as any).data as StationData[] | null;
		const stationsError = (stationsResult as any).error as any | null;

		if (stationsError) {
			throw new Error(`Erro ao buscar estações: ${stationsError.message}`);
		}

		if (!allStations || allStations.length === 0) {
			throw new Error('Nenhuma estação ativa encontrada no banco de dados');
		}

		// 2. Seleção determinística ou aleatória
		let selectedStations: StationData[];
		if (seed) {
			console.log('🎲 Aplicando seleção determinística com seed...');
			const shuffled = [...allStations].sort((a, b) => {
				const hashA = (seed + a.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
				const hashB = (seed + b.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
				return hashA - hashB;
			});
			selectedStations = shuffled.slice(0, 5);
		} else {
			console.log('🎲 Aplicando seleção aleatória...');
			const shuffled = [...allStations];
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
			}
			selectedStations = shuffled.slice(0, 5);
		}

		if (selectedStations.length < 5) {
			console.warn(`⚠️ Apenas ${selectedStations.length} estações disponíveis (esperado: 5)`);
		}

		console.log(`✅ ${selectedStations.length} estações selecionadas:`, selectedStations.map(s => `${s.code} - ${s.name}`));

		// Distribuição por especialidade
		const specialtyDistribution: Record<string, number> = {};
		selectedStations.forEach(station => {
			specialtyDistribution[station.specialty] = (specialtyDistribution[station.specialty] || 0) + 1;
		});

		// 3. Criar registro da simulação
		console.log('💾 Criando registro da simulação...');
		const simulationMetadata = {
			seed,
			specialty_distribution: specialtyDistribution,
			created_with_version: '3.0'
		};

		const { data: simulation, error: simulationError } = await supabase
			.from('simulations')
			.insert({
				id: simulationId,
				user_id: 'demo-user',
				simulation_type: 'exam_day',
				status: 'created',
				total_stations: selectedStations.length,
				metadata: simulationMetadata,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			})
			.select()
			.single();

		if (simulationError) {
			console.error('❌ Erro ao criar simulação:', simulationError);
		} else {
			console.log('✅ Simulação criada:', simulation.id);
		}

		// 4. Criar registros das estações
		console.log('📋 Criando registros das estações...');
		const simulationStations = selectedStations.map((station, index) => ({
			simulation_id: simulationId,
			station_id: station.id,
			station_order: index + 1,
			status: 'pending',
			metadata: {
				criteria_count: station.criteria?.length || 0,
				specialty: station.specialty
			},
			created_at: new Date().toISOString()
		}));

		const { error: stationsError2 } = await supabase
			.from('simulation_stations')
			.insert(simulationStations);

		if (stationsError2) {
			console.error('❌ Erro ao criar estações da simulação:', stationsError2);
		} else {
			console.log('✅ Estações da simulação criadas');
		}

		// 5. Resposta
		const response: SimulationResponse = {
			ok: true,
			simulationId,
			stations: selectedStations.map(station => ({
				id: station.id,
				name: station.name,
				specialty: station.specialty,
				code: station.code,
				participant_info: station.participant_info,
				actor_info: station.actor_info,
				available_exams: station.available_exams,
				is_active: station.is_active,
				difficulty_level: station.difficulty_level,
				estimated_duration: station.estimated_duration,
				created_by: station.created_by,
				tags: station.tags,
				created_at: station.created_at,
				updated_at: station.updated_at,
				criteria: station.criteria || []
			})),
			metadata: {
				seed,
				specialty_distribution: specialtyDistribution
			},
			message: `Simulação criada com ${selectedStations.length} estações${seed ? ' (modo determinístico)' : ' (modo aleatório)'}`
		};

		console.log('🎉 Simulação criada com sucesso!');
		console.log(`📊 Estações: ${selectedStations.map(s => s.code).join(' → ')}`);
		if (seed) console.log(`🎲 Seed utilizada: ${seed}`);

		return res.status(200).json(response);

	} catch (error) {
		console.error('💥 Erro ao criar simulação:', error);
		return res.status(500).json({
			ok: false,
			error: 'simulation_creation_failed',
			message: error instanceof Error ? error.message : 'Erro desconhecido ao criar simulação',
			timestamp: new Date().toISOString()
		});
	}
}


