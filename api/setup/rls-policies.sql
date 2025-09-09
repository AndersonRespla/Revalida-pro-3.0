-- =====================================================
-- CONFIGURAÇÃO DE RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_materials ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA USERS
-- =====================================================

-- Usuários podem ver e editar apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- POLÍTICAS PARA SIMULATIONS
-- =====================================================

-- Usuários podem ver simulações que criaram ou participam
CREATE POLICY "Users can view own simulations" ON public.simulations
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid()::text = ANY(
      SELECT jsonb_array_elements_text(metadata->'participants')
    )
  );

-- Usuários podem criar simulações
CREATE POLICY "Users can create simulations" ON public.simulations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar simulações que criaram
CREATE POLICY "Users can update own simulations" ON public.simulations
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA SIMULATION_STATIONS
-- =====================================================

-- Usuários podem ver estações de simulações que participam
CREATE POLICY "Users can view simulation stations" ON public.simulation_stations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.simulations s
      WHERE s.id = simulation_stations.simulation_id
      AND (
        auth.uid() = s.user_id OR 
        auth.uid()::text = ANY(
          SELECT jsonb_array_elements_text(s.metadata->'participants')
        )
      )
    )
  );

-- Usuários podem atualizar estações de simulações que criaram
CREATE POLICY "Users can update simulation stations" ON public.simulation_stations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.simulations s
      WHERE s.id = simulation_stations.simulation_id
      AND auth.uid() = s.user_id
    )
  );

-- =====================================================
-- POLÍTICAS PARA USER_SESSIONS
-- =====================================================

-- Usuários podem ver apenas suas próprias sessões
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias sessões
CREATE POLICY "Users can create own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias sessões
CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA USER_PROGRESS
-- =====================================================

-- Usuários podem ver apenas seu próprio progresso
CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar seu próprio progresso
CREATE POLICY "Users can create own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seu próprio progresso
CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA USER_ACHIEVEMENTS
-- =====================================================

-- Usuários podem ver apenas suas próprias conquistas
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias conquistas
CREATE POLICY "Users can create own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA SIMULATION_RESULTS
-- =====================================================

-- Usuários podem ver apenas seus próprios resultados
CREATE POLICY "Users can view own results" ON public.simulation_results
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar seus próprios resultados
CREATE POLICY "Users can create own results" ON public.simulation_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA STUDY_TIME_TRACKING
-- =====================================================

-- Usuários podem ver apenas seu próprio tempo de estudo
CREATE POLICY "Users can view own study time" ON public.study_time_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar seu próprio tempo de estudo
CREATE POLICY "Users can create own study time" ON public.study_time_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seu próprio tempo de estudo
CREATE POLICY "Users can update own study time" ON public.study_time_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA USER_ANALYTICS
-- =====================================================

-- Usuários podem ver apenas suas próprias analytics
CREATE POLICY "Users can view own analytics" ON public.user_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias analytics
CREATE POLICY "Users can create own analytics" ON public.user_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA AUDIO_RECORDINGS
-- =====================================================

-- Usuários podem ver apenas suas próprias gravações
CREATE POLICY "Users can view own recordings" ON public.audio_recordings
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias gravações
CREATE POLICY "Users can create own recordings" ON public.audio_recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias gravações
CREATE POLICY "Users can update own recordings" ON public.audio_recordings
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA LIBRARY_MATERIALS
-- =====================================================

-- Todos podem ver materiais da biblioteca (públicos)
CREATE POLICY "Anyone can view library materials" ON public.library_materials
  FOR SELECT USING (is_active = true);

-- Apenas administradores podem criar/editar materiais
CREATE POLICY "Admins can manage library materials" ON public.library_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- POLÍTICAS PARA STATIONS
-- =====================================================

-- Todos podem ver estações (públicas)
CREATE POLICY "Anyone can view stations" ON public.stations
  FOR SELECT USING (true);

-- Apenas administradores podem criar/editar estações
CREATE POLICY "Admins can manage stations" ON public.stations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON POLICY "Users can view own profile" ON public.users IS 'Usuários podem ver apenas seu próprio perfil';
COMMENT ON POLICY "Users can view own sessions" ON public.user_sessions IS 'Usuários podem ver apenas suas próprias sessões';
COMMENT ON POLICY "Anyone can view library materials" ON public.library_materials IS 'Materiais da biblioteca são públicos para leitura';
COMMENT ON POLICY "Admins can manage library materials" ON public.library_materials IS 'Apenas administradores podem gerenciar materiais';
