-- =====================================================
-- TABELA DE FEEDBACK
-- =====================================================

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Relacionamentos
  simulation_id UUID NOT NULL,
  station_number INTEGER,
  
  -- Pontuações
  overall_score DECIMAL(4,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
  percentage_score DECIMAL(5,2) NOT NULL CHECK (percentage_score >= 0 AND percentage_score <= 100),
  
  -- Detalhamento por critério
  criteria_scores JSONB NOT NULL DEFAULT '[]',
  
  -- Análise qualitativa
  strengths TEXT[],
  improvements TEXT[],
  clinical_accuracy TEXT,
  communication_skills TEXT,
  
  -- Metadados
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generation_method TEXT DEFAULT 'ai', -- 'ai', 'manual', 'hybrid'
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Índice único para evitar duplicatas
  CONSTRAINT unique_simulation_station_feedback UNIQUE (simulation_id, station_number)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_feedback_simulation_id ON public.feedback (simulation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_station ON public.feedback (simulation_id, station_number);
CREATE INDEX IF NOT EXISTS idx_feedback_score ON public.feedback (overall_score);
CREATE INDEX IF NOT EXISTS idx_feedback_generated_at ON public.feedback (generated_at);

-- Trigger para updated_at
CREATE TRIGGER trg_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- View para feedback consolidado por simulação
CREATE OR REPLACE VIEW public.simulation_feedback_summary AS
SELECT 
  f.simulation_id,
  COUNT(DISTINCT f.station_number) as total_stations_evaluated,
  AVG(f.overall_score) as average_score,
  AVG(f.percentage_score) as average_percentage,
  MIN(f.overall_score) as min_score,
  MAX(f.overall_score) as max_score,
  ARRAY_AGG(DISTINCT unnest) as all_strengths,
  ARRAY_AGG(DISTINCT unnest2) as all_improvements,
  MAX(f.generated_at) as last_feedback_at
FROM public.feedback f
LEFT JOIN LATERAL unnest(f.strengths) ON true
LEFT JOIN LATERAL unnest(f.improvements) unnest2 ON true
GROUP BY f.simulation_id;

-- Comentários
COMMENT ON TABLE public.feedback IS 'Feedback detalhado das simulações OSCE';
COMMENT ON COLUMN public.feedback.criteria_scores IS 'Array JSON com pontuações detalhadas por critério';
COMMENT ON COLUMN public.feedback.strengths IS 'Pontos fortes identificados na performance';
COMMENT ON COLUMN public.feedback.improvements IS 'Áreas que necessitam melhoria';
COMMENT ON COLUMN public.feedback.generation_method IS 'Método de geração: ai (automático), manual, hybrid';
