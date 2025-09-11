-- =====================================================
-- MIGRAÇÃO FINAL - COMPATÍVEL COM ENUM EXISTENTE
-- =====================================================

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

-- Função auxiliar para verificar se um ENUM existe
CREATE OR REPLACE FUNCTION enum_exists(enum_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = enum_name
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
        -- Verificar se o ENUM simulation_status existe
        IF enum_exists('simulation_status') THEN
            -- Usar o ENUM existente
            CREATE TABLE simulations (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                simulation_type TEXT NOT NULL,
                status simulation_status DEFAULT 'created',
                total_stations INTEGER NOT NULL DEFAULT 0,
                current_station INTEGER DEFAULT 1,
                started_at TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                metadata JSONB
            );
            RAISE NOTICE 'Tabela simulations criada usando ENUM simulation_status existente';
        ELSE
            -- Criar sem ENUM
            CREATE TABLE simulations (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                simulation_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'created',
                total_stations INTEGER NOT NULL DEFAULT 0,
                current_station INTEGER DEFAULT 1,
                started_at TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                metadata JSONB
            );
            RAISE NOTICE 'Tabela simulations criada sem ENUM';
        END IF;
    ELSE
        -- Se a tabela existe, adiciona apenas as colunas que faltam
        RAISE NOTICE 'Tabela simulations já existe, verificando colunas...';
        
        IF NOT column_exists('simulations', 'user_id') THEN
            ALTER TABLE simulations ADD COLUMN user_id TEXT;
            RAISE NOTICE 'Coluna user_id adicionada';
        END IF;
        
        IF NOT column_exists('simulations', 'simulation_type') THEN
            ALTER TABLE simulations ADD COLUMN simulation_type TEXT;
            RAISE NOTICE 'Coluna simulation_type adicionada';
        END IF;
        
        -- Para status, verificar se já usa ENUM
        IF NOT column_exists('simulations', 'status') THEN
            IF enum_exists('simulation_status') THEN
                ALTER TABLE simulations ADD COLUMN status simulation_status DEFAULT 'created';
                RAISE NOTICE 'Coluna status adicionada usando ENUM simulation_status';
            ELSE
                ALTER TABLE simulations ADD COLUMN status TEXT DEFAULT 'created';
                RAISE NOTICE 'Coluna status adicionada como TEXT';
            END IF;
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
            simulation_id TEXT NOT NULL,
            station_id TEXT NOT NULL,
            station_order INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            started_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            duration_seconds INTEGER,
            transcript TEXT,
            feedback TEXT,
            score DECIMAL(5,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela simulation_stations criada do zero';
    ELSE
        -- Se a tabela existe, adiciona apenas as colunas que faltam
        RAISE NOTICE 'Tabela simulation_stations já existe, verificando colunas...';
        
        IF NOT column_exists('simulation_stations', 'simulation_id') THEN
            ALTER TABLE simulation_stations ADD COLUMN simulation_id TEXT;
            RAISE NOTICE 'Coluna simulation_id adicionada';
        END IF;
        
        IF NOT column_exists('simulation_stations', 'station_id') THEN
            ALTER TABLE simulation_stations ADD COLUMN station_id TEXT;
            RAISE NOTICE 'Coluna station_id adicionada';
        END IF;
        
        IF NOT column_exists('simulation_stations', 'station_order') THEN
            ALTER TABLE simulation_stations ADD COLUMN station_order INTEGER;
            RAISE NOTICE 'Coluna station_order adicionada';
        END IF;
        
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
-- ADICIONAR CONSTRAINTS (após criar todas as colunas)
-- =====================================================

-- Constraints para simulations
DO $$
BEGIN
    -- Adicionar constraint CHECK para simulation_type se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'simulations' 
        AND constraint_name = 'simulations_simulation_type_check'
    ) THEN
        ALTER TABLE simulations ADD CONSTRAINT simulations_simulation_type_check 
        CHECK (simulation_type IN ('exam_day', 'study', 'hybrid'));
        RAISE NOTICE 'Constraint simulation_type adicionada';
    END IF;
    
    -- NÃO adicionar constraint CHECK para status se já usar ENUM
    -- O ENUM já controla os valores válidos
END $$;

-- Constraints para simulation_stations
DO $$
BEGIN
    -- Adicionar constraint CHECK para status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'simulation_stations' 
        AND constraint_name = 'simulation_stations_status_check'
    ) THEN
        ALTER TABLE simulation_stations ADD CONSTRAINT simulation_stations_status_check 
        CHECK (status IN ('pending', 'active', 'completed', 'skipped'));
        RAISE NOTICE 'Constraint status adicionada em simulation_stations';
    END IF;
    
    -- Adicionar constraint UNIQUE se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'simulation_stations' 
        AND constraint_name = 'simulation_stations_simulation_id_station_order_key'
    ) THEN
        ALTER TABLE simulation_stations ADD CONSTRAINT simulation_stations_simulation_id_station_order_key 
        UNIQUE (simulation_id, station_order);
        RAISE NOTICE 'Constraint UNIQUE adicionada em simulation_stations';
    END IF;
END $$;

-- Foreign Keys (após criar todas as colunas)
DO $$
BEGIN
    -- FK para simulations -> stations (se a tabela stations existir)
    IF table_exists('stations') AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'simulation_stations' 
        AND constraint_name = 'simulation_stations_station_id_fkey'
    ) THEN
        ALTER TABLE simulation_stations ADD CONSTRAINT simulation_stations_station_id_fkey 
        FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE;
        RAISE NOTICE 'FK station_id adicionada';
    END IF;
    
    -- FK para simulation_stations -> simulations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'simulation_stations' 
        AND constraint_name = 'simulation_stations_simulation_id_fkey'
    ) THEN
        ALTER TABLE simulation_stations ADD CONSTRAINT simulation_stations_simulation_id_fkey 
        FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE;
        RAISE NOTICE 'FK simulation_id adicionada';
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
DROP FUNCTION IF EXISTS enum_exists(TEXT);

-- =====================================================
-- RESULTADO FINAL
-- =====================================================

SELECT 'Migração final concluída com sucesso!' as status;
