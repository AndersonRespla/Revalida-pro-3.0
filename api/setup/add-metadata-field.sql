-- Adicionar campo metadata para tabela simulations
ALTER TABLE simulations 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Comentário para documentação
COMMENT ON COLUMN simulations.metadata IS 'Metadados da simulação incluindo seed, distribuição por especialidade, versão, etc.';

-- Adicionar campo metadata para tabela simulation_stations também
ALTER TABLE simulation_stations 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Comentário para documentação
COMMENT ON COLUMN simulation_stations.metadata IS 'Metadados da estação incluindo contagem de critérios, especialidade, etc.';
