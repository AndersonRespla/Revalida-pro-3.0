-- =====================================================
-- TABELAS DE SIMULAÇÕES
-- =====================================================

-- Tabela principal de simulações
CREATE TABLE IF NOT EXISTS public.simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Relacionamento com usuário criador
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Dados da simulação
  session_type TEXT NOT NULL CHECK (session_type IN ('simulation_exam', 'simulation_study', 'collaborative', 'hybrid')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  
  -- Configurações
  max_participants INTEGER DEFAULT 2,
  current_station_index INTEGER DEFAULT 0,
  
  -- Metadados flexíveis
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Tabela de estações da simulação
CREATE TABLE IF NOT EXISTS public.simulation_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Relacionamentos
  simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  
  -- Dados da estação
  station_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'current', 'completed', 'skipped')),
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Resultados
  score DECIMAL(5,2),
  feedback TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON public.simulations (user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON public.simulations (status);
CREATE INDEX IF NOT EXISTS idx_simulations_session_type ON public.simulations (session_type);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON public.simulations (created_at);

CREATE INDEX IF NOT EXISTS idx_simulation_stations_simulation_id ON public.simulation_stations (simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_stations_station_id ON public.simulation_stations (station_id);
CREATE INDEX IF NOT EXISTS idx_simulation_stations_status ON public.simulation_stations (status);

-- Triggers para updated_at
CREATE TRIGGER trg_simulations_updated_at
  BEFORE UPDATE ON public.simulations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Função para atualizar status da simulação
CREATE OR REPLACE FUNCTION public.update_simulation_status(
  p_simulation_id UUID,
  p_status TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.simulations 
  SET status = p_status,
      updated_at = NOW(),
      started_at = CASE WHEN p_status = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
      ended_at = CASE WHEN p_status IN ('completed', 'cancelled') THEN NOW() ELSE ended_at END
  WHERE id = p_simulation_id;
END;
$$ LANGUAGE plpgsql;

-- Função para avançar para próxima estação
CREATE OR REPLACE FUNCTION public.advance_simulation_station(
  p_simulation_id UUID
)
RETURNS TABLE(next_station_id UUID, station_number INTEGER) AS $$
DECLARE
  current_index INTEGER;
  next_station RECORD;
BEGIN
  -- Buscar índice atual
  SELECT current_station_index INTO current_index
  FROM public.simulations
  WHERE id = p_simulation_id;
  
  -- Marcar estação atual como completa
  UPDATE public.simulation_stations
  SET status = 'completed',
      completed_at = NOW()
  WHERE simulation_id = p_simulation_id 
    AND station_number = current_index + 1;
  
  -- Buscar próxima estação
  SELECT station_id, station_number INTO next_station
  FROM public.simulation_stations
  WHERE simulation_id = p_simulation_id 
    AND station_number = current_index + 2
  LIMIT 1;
  
  IF FOUND THEN
    -- Atualizar para próxima estação
    UPDATE public.simulations
    SET current_station_index = current_index + 1,
        updated_at = NOW();
    
    UPDATE public.simulation_stations
    SET status = 'current',
        started_at = NOW()
    WHERE simulation_id = p_simulation_id 
      AND station_number = current_index + 2;
    
    RETURN QUERY SELECT next_station.station_id, next_station.station_number;
  ELSE
    -- Não há mais estações, marcar simulação como completa
    PERFORM public.update_simulation_status(p_simulation_id, 'completed');
    RETURN QUERY SELECT NULL::UUID, 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE public.simulations IS 'Simulações OSCE (individuais, colaborativas e híbridas)';
COMMENT ON TABLE public.simulation_stations IS 'Estações de uma simulação específica';
COMMENT ON FUNCTION public.update_simulation_status IS 'Atualiza o status de uma simulação';
COMMENT ON FUNCTION public.advance_simulation_station IS 'Avança para a próxima estação da simulação';
