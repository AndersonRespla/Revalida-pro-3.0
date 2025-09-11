-- Tabela para armazenar simulações
-- Compatibilidade: se a tabela já existir sem certas colunas (ex.: user_id),
-- adicionamos as colunas necessárias de forma idempotente.
ALTER TABLE IF EXISTS simulations ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE IF EXISTS simulations ADD COLUMN IF NOT EXISTS simulation_type TEXT;
ALTER TABLE IF EXISTS simulations ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE IF EXISTS simulations ADD COLUMN IF NOT EXISTS total_stations INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS simulations ADD COLUMN IF NOT EXISTS current_station INTEGER DEFAULT 1;
ALTER TABLE IF EXISTS simulations ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS simulations ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS simulations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE IF EXISTS simulations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE IF EXISTS simulations ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE TABLE IF NOT EXISTS simulations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    simulation_type TEXT NOT NULL CHECK (simulation_type IN ('exam_day', 'study', 'hybrid')),
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'running', 'completed', 'cancelled')),
    total_stations INTEGER NOT NULL DEFAULT 0,
    current_station INTEGER DEFAULT 1,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar estações de cada simulação
CREATE TABLE IF NOT EXISTS simulation_stations (
    id SERIAL PRIMARY KEY,
    simulation_id TEXT NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    station_id TEXT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    station_order INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    transcript TEXT,
    feedback TEXT,
    score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(simulation_id, station_order)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at);
CREATE INDEX IF NOT EXISTS idx_simulation_stations_simulation_id ON simulation_stations(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_stations_station_id ON simulation_stations(station_id);
CREATE INDEX IF NOT EXISTS idx_simulation_stations_status ON simulation_stations(status);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_simulations_updated_at 
    BEFORE UPDATE ON simulations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_stations_updated_at 
    BEFORE UPDATE ON simulation_stations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - desabilitado por enquanto para desenvolvimento
-- ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE simulation_stations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (comentadas - ativar quando necessário)
/*
-- Políticas para simulations
CREATE POLICY "Users can view their own simulations" ON simulations
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own simulations" ON simulations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own simulations" ON simulations
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Políticas para simulation_stations
CREATE POLICY "Users can view stations of their simulations" ON simulation_stations
    FOR SELECT USING (
        simulation_id IN (
            SELECT id FROM simulations WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create stations for their simulations" ON simulation_stations
    FOR INSERT WITH CHECK (
        simulation_id IN (
            SELECT id FROM simulations WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update stations of their simulations" ON simulation_stations
    FOR UPDATE USING (
        simulation_id IN (
            SELECT id FROM simulations WHERE user_id = auth.uid()::text
        )
    );
*/

-- Comentários para documentação
COMMENT ON TABLE simulations IS 'Armazena simulações OSCE dos usuários';
COMMENT ON TABLE simulation_stations IS 'Armazena estações específicas de cada simulação';

COMMENT ON COLUMN simulations.simulation_type IS 'Tipo da simulação: exam_day, study, hybrid';
COMMENT ON COLUMN simulations.status IS 'Status atual da simulação';
COMMENT ON COLUMN simulations.total_stations IS 'Número total de estações na simulação';
COMMENT ON COLUMN simulations.current_station IS 'Estação atual sendo executada';

COMMENT ON COLUMN simulation_stations.station_order IS 'Ordem da estação na simulação (1-5)';
COMMENT ON COLUMN simulation_stations.status IS 'Status da estação específica';
COMMENT ON COLUMN simulation_stations.duration_seconds IS 'Duração real da estação em segundos';
COMMENT ON COLUMN simulation_stations.transcript IS 'Transcrição da conversa da estação';
COMMENT ON COLUMN simulation_stations.feedback IS 'Feedback específico da estação';
COMMENT ON COLUMN simulation_stations.score IS 'Pontuação obtida na estação';
