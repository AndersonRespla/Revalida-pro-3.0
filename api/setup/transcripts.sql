-- =====================================================
-- TABELA DE TRANSCRIÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Relacionamentos
  simulation_id UUID NOT NULL,
  recording_id UUID REFERENCES public.audio_recordings(id) ON DELETE SET NULL,
  
  -- Dados da transcrição
  station INTEGER NOT NULL,
  transcript TEXT NOT NULL,
  audio_path TEXT NOT NULL,
  
  -- Metadados da transcrição
  language VARCHAR(10) DEFAULT 'pt',
  duration_seconds INTEGER,
  keywords TEXT[],
  
  -- Vinculação com critérios
  criteria_ids UUID[],
  
  -- Análise e feedback (para uso futuro)
  ai_analysis JSONB,
  feedback_generated BOOLEAN DEFAULT FALSE,
  
  -- Índice único para evitar duplicatas
  CONSTRAINT unique_simulation_station UNIQUE (simulation_id, station)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transcripts_simulation_id ON public.transcripts (simulation_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_recording_id ON public.transcripts (recording_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_station ON public.transcripts (station);
CREATE INDEX IF NOT EXISTS idx_transcripts_keywords ON public.transcripts USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON public.transcripts (created_at);

-- Trigger para updated_at
CREATE TRIGGER trg_transcripts_updated_at
  BEFORE UPDATE ON public.transcripts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Comentários
COMMENT ON TABLE public.transcripts IS 'Transcrições das gravações de áudio das simulações OSCE';
COMMENT ON COLUMN public.transcripts.keywords IS 'Palavras-chave extraídas da transcrição para análise';
COMMENT ON COLUMN public.transcripts.criteria_ids IS 'IDs dos critérios de avaliação vinculados a esta estação';
COMMENT ON COLUMN public.transcripts.ai_analysis IS 'Análise de IA sobre a performance (JSON)';
COMMENT ON COLUMN public.transcripts.feedback_generated IS 'Indica se o feedback já foi gerado para esta transcrição';
