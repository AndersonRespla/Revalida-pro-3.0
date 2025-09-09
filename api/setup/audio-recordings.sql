-- =====================================================
-- TABELA DE GRAVAÇÕES DE ÁUDIO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audio_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Relacionamentos
  simulation_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Dados da gravação
  station INTEGER NOT NULL,
  total_stations INTEGER DEFAULT 1,
  session_type TEXT NOT NULL DEFAULT 'simulation',
  
  -- Status e timestamps
  status TEXT NOT NULL DEFAULT 'recording' CHECK (status IN ('recording', 'processing', 'ready_for_transcription', 'transcribed', 'completed', 'error')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  last_chunk_at TIMESTAMPTZ,
  
  -- Dados do áudio
  audio_url TEXT,
  chunks_count INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  
  -- Resultados
  transcript TEXT,
  feedback TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audio_recordings_user_id ON public.audio_recordings (user_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_simulation_id ON public.audio_recordings (simulation_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_status ON public.audio_recordings (status);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_created_at ON public.audio_recordings (created_at);

-- Trigger para updated_at
CREATE TRIGGER trg_audio_recordings_updated_at
  BEFORE UPDATE ON public.audio_recordings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Comentários
COMMENT ON TABLE public.audio_recordings IS 'Gravações de áudio das simulações OSCE';
COMMENT ON COLUMN public.audio_recordings.status IS 'Status da gravação: recording, processing, ready_for_transcription, transcribed, completed, error';
COMMENT ON COLUMN public.audio_recordings.session_type IS 'Tipo de sessão: simulation, study, collaborative, hybrid';
