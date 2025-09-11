-- =====================================================
-- MIGRAÇÃO IDEMPOTENTE PARA TABELAS DE SIMULAÇÃO
-- =====================================================
-- Este script verifica o que já existe e só cria o que falta

-- Função auxiliar para verificar se uma coluna existe
CREATE OR REPLACE FUNCTION column_exists(tbl_name TEXT, col_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = tbl_name 
        AND column_name = col_name
    );
END;
$$ LANGUAGE plpgsql;

-- Função auxiliar para verificar se uma tabela existe
CREATE OR REPLACE FUNCTION table_exists(tbl_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = tbl_name
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRAÇÃO DA TABELA SIMULATIONS
-- =====================================================

DO $$
BEGIN
    -- Se a tabela simulations não existe, cria ela completa
    IF NOT table_exists('simulations') THEN
        CREATE TABLE simulations (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            simulation_type TEXT NOT NULL CHECK (simulation_type IN ('exam_day', 'study', 'hybrid')),
            status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'running', 'completed', 'cancelled')),
            total_stations INTEGER NOT NULL DEFAULT 0,
            current_station INTEGER DEFAULT 1,
            started_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            metadata JSONB
        );
        
        RAISE NOTICE 'Tabela simulations criada do zero';
    ELSE
        -- Se a tabela existe, adiciona apenas as colunas que faltam
        RAISE NOTICE 'Tabela simulations já existe, verificando colunas...';
        
        -- Adiciona colunas uma por uma, apenas se não existirem
        IF NOT column_exists('simulations', 'user_id') THEN
            ALTER TABLE simulations ADD COLUMN user_id TEXT;
            RAISE NOTICE 'Coluna user_id adicionada';
        END IF;
        
        IF NOT column_exists('simulations', 'simulation_type') THEN
            ALTER TABLE simulations ADD COLUMN simulation_type TEXT;
            RAISE NOTICE 'Coluna simulation_type adicionada';
        END IF;
        
        IF NOT column_exists('simulations', 'status') THEN
            ALTER TABLE simulations ADD COLUMN status TEXT DEFAULT 'created';
            RAISE NOTICE 'Coluna status adicionada';
        END IF;
        
        IF NOT column_exists('simulations', 'total_stations') THEN
            ALTER TABLE simulations ADD COLUMN total_stations INTEGER DEFAULT 0;
            RAISE NOTICE 'Coluna total_stations adicionada';
        END IF;
        
        IF NOT column_exists('simulations', 'current_station') THEN
            ALTER TABLE simulations ADD COLUMN current_station INTEGER DEFAULT 1;
            RAISE NOTICE 'Coluna current_station adicionada';
        END IF;
        
        IF NOT column_exists('simulations', 'started_at') THEN
            ALTER TABLE simulations ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Coluna started_at adicionada';
        END IF;
        
        IF NOT column_exists('simulations', 'completed_at') THEN
            ALTER TABLE simulations ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Coluna completed_at adicionada';
        END IF;
        
        IF NOT column_exists('simulations', 'created_at') THEN
            ALTER TABLE simulations ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Coluna created_at adicionada';
        END IF;
        
        IF NOT column_exists('simulations', 'updated_at') THEN
            ALTER TABLE simulations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Coluna updated_at adicionada';
        END IF;
        
        IF NOT column_exists('simulations', 'metadata') THEN
            ALTER TABLE simulations ADD COLUMN metadata JSONB;
            RAISE NOTICE 'Coluna metadata adicionada';
        END IF;
    END IF;
END $$;

-- =====================================================
-- MIGRAÇÃO DA TABELA SIMULATION_STATIONS
-- =====================================================

DO $$
BEGIN
    -- Se a tabela simulation_stations não existe, cria ela completa
    IF NOT table_exists('simulation_stations') THEN
        CREATE TABLE simulation_stations (
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
        
        RAISE NOTICE 'Tabela simulation_stations criada do zero';
    ELSE
        -- Se a tabela existe, adiciona apenas as colunas que faltam
        RAISE NOTICE 'Tabela simulation_stations já existe, verificando colunas...';
        
        -- Adiciona colunas uma por uma, apenas se não existirem
        IF NOT column_exists('simulation_stations', 'status') THEN
            ALTER TABLE simulation_stations ADD COLUMN status TEXT DEFAULT 'pending';
            RAISE NOTICE 'Coluna status adicionada em simulation_stations';
        END IF;
        
        IF NOT column_exists('simulation_stations', 'started_at') THEN
            ALTER TABLE simulation_stations ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Coluna started_at adicionada em simulation_stations';
        END IF;
        
        IF NOT column_exists('simulation_stations', 'completed_at') THEN
            ALTER TABLE simulation_stations ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Coluna completed_at adicionada em simulation_stations';
        END IF;
        
        IF NOT column_exists('simulation_stations', 'duration_seconds') THEN
            ALTER TABLE simulation_stations ADD COLUMN duration_seconds INTEGER;
            RAISE NOTICE 'Coluna duration_seconds adicionada em simulation_stations';
        END IF;
        
        IF NOT column_exists('simulation_stations', 'transcript') THEN
            ALTER TABLE simulation_stations ADD COLUMN transcript TEXT;
            RAISE NOTICE 'Coluna transcript adicionada em simulation_stations';
        END IF;
        
        IF NOT column_exists('simulation_stations', 'feedback') THEN
            ALTER TABLE simulation_stations ADD COLUMN feedback TEXT;
            RAISE NOTICE 'Coluna feedback adicionada em simulation_stations';
        END IF;
        
        IF NOT column_exists('simulation_stations', 'score') THEN
            ALTER TABLE simulation_stations ADD COLUMN score DECIMAL(5,2);
            RAISE NOTICE 'Coluna score adicionada em simulation_stations';
        END IF;
        
        IF NOT column_exists('simulation_stations', 'created_at') THEN
            ALTER TABLE simulation_stations ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Coluna created_at adicionada em simulation_stations';
        END IF;
        
        IF NOT column_exists('simulation_stations', 'updated_at') THEN
            ALTER TABLE simulation_stations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Coluna updated_at adicionada em simulation_stations';
        END IF;
    END IF;
END $$;

-- =====================================================
-- ÍNDICES (criados apenas se não existirem)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at);
CREATE INDEX IF NOT EXISTS idx_simulation_stations_simulation_id ON simulation_stations(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_stations_station_id ON simulation_stations(station_id);
CREATE INDEX IF NOT EXISTS idx_simulation_stations_status ON simulation_stations(status);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at (criados apenas se não existirem)
DROP TRIGGER IF EXISTS update_simulations_updated_at ON simulations;
CREATE TRIGGER update_simulations_updated_at 
    BEFORE UPDATE ON simulations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_simulation_stations_updated_at ON simulation_stations;
CREATE TRIGGER update_simulation_stations_updated_at 
    BEFORE UPDATE ON simulation_stations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

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

-- =====================================================
-- LIMPEZA (remove as funções auxiliares)
-- =====================================================

DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT);
DROP FUNCTION IF EXISTS table_exists(TEXT);

-- =====================================================
-- RESULTADO FINAL
-- =====================================================

SELECT 'Migração concluída com sucesso!' as status;
