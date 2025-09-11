-- Tabela para armazenar eventos das simulações
CREATE TABLE IF NOT EXISTS simulation_events (
    id SERIAL PRIMARY KEY,
    simulation_id TEXT NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    station_number INTEGER,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'simulation_started',
        'station_started', 
        'handoff_initiated',
        'handoff_completed',
        'handoff_failed',
        'moderator_returned',
        'station_completed',
        'timeout_warning',
        'timeout_reached',
        'exam_requested',
        'exam_released',
        'voice_command_detected',
        'transcription_started',
        'transcription_completed',
        'feedback_generated',
        'simulation_completed',
        'error'
    )),
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_simulation_events_simulation_id ON simulation_events(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_events_event_type ON simulation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_simulation_events_created_at ON simulation_events(created_at);
CREATE INDEX IF NOT EXISTS idx_simulation_events_station ON simulation_events(simulation_id, station_number);

-- Comentários para documentação
COMMENT ON TABLE simulation_events IS 'Registro de todos os eventos ocorridos durante as simulações';
COMMENT ON COLUMN simulation_events.event_type IS 'Tipo do evento ocorrido';
COMMENT ON COLUMN simulation_events.event_data IS 'Dados adicionais do evento em formato JSON';
COMMENT ON COLUMN simulation_events.station_number IS 'Número da estação (1-5) quando aplicável';
