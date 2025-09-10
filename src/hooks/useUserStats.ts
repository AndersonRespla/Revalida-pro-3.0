import { useQuery } from "@tanstack/react-query";

// Interface para estatísticas do usuário
export interface UserStats {
  progressPercentage: number;
  nextGoalPercentage: number;
  studyTimeThisWeek: number;
  totalSessions: number;
  averageScore: number;
  ranking: number | null;
  totalUsers: number;
  percentile: number;
  achievements: number;
  sessionsThisWeek: number;
}

// Interface para atividade do usuário
export interface UserActivity {
  id: string;
  user_id: string;
  session_type: string;
  started_at: string;
  duration_minutes: number | null;
  total_score: number | null;
  stations_completed: number | null;
  activity_title: string;
  score_display: string;
  time_relative: string;
}

// Interface para progresso por especialidade
export interface UserProgress {
  id: string;
  user_id: string;
  specialty: string;
  total_simulations: number;
  completed_simulations: number;
  average_score: number;
  best_score: number;
  mastery_level: string;
  mastery_percentage: number;
  last_simulation_at: string | null;
}

// Interface para conquistas
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string | null;
  earned_at: string;
  points_awarded: number | null;
}

// Hook para buscar estatísticas gerais do usuário
export function useUserStats(userId: string = 'demo-user') {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async (): Promise<UserStats> => {
      const response = await fetch(`/api/consolidated?action=user-stats&userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar estatísticas do usuário');
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }
      return data.stats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 3,
    enabled: Boolean(userId),
  });
}

// Hook para buscar histórico de atividades
export function useUserActivity(userId: string = 'demo-user', limit: number = 5) {
  return useQuery({
    queryKey: ['user-activity', userId, limit],
    queryFn: async (): Promise<UserActivity[]> => {
      const response = await fetch(
        `/api/consolidated?action=user-activity&userId=${encodeURIComponent(userId)}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error('Falha ao buscar atividades do usuário');
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }
      return data.activities;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 3,
    enabled: Boolean(userId),
  });
}

// Hook para buscar progresso por especialidade
export function useUserProgress(userId: string = 'demo-user') {
  return useQuery({
    queryKey: ['user-progress', userId],
    queryFn: async (): Promise<UserProgress[]> => {
      const response = await fetch(`/api/consolidated?action=user-progress&userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar progresso do usuário');
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }
      return data.progress;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 3,
    enabled: Boolean(userId),
  });
}

// Hook para buscar conquistas do usuário
export function useUserAchievements(userId: string = 'demo-user') {
  return useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async (): Promise<UserAchievement[]> => {
      const response = await fetch(`/api/consolidated?action=user-achievements&userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar conquistas do usuário');
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }
      return data.achievements;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 3,
    enabled: Boolean(userId),
  });
}

// Hook combinado para buscar todos os dados do usuário
export function useUserData(userId: string = 'demo-user') {
  const stats = useUserStats(userId);
  const activity = useUserActivity(userId);
  const progress = useUserProgress(userId);
  const achievements = useUserAchievements(userId);

  return {
    stats,
    activity,
    progress,
    achievements,
    isLoading: stats.isLoading || activity.isLoading || progress.isLoading || achievements.isLoading,
    isError: stats.isError || activity.isError || progress.isError || achievements.isError,
    error: stats.error || activity.error || progress.error || achievements.error,
  };
}

// === HOOKS PARA BIBLIOTECA ===

// Hook para buscar materiais da biblioteca
export function useLibraryMaterials(searchTerm: string = '', category: string = 'all') {
  return useQuery({
    queryKey: ['library-materials', searchTerm, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('action', 'library-materials');
      if (searchTerm) params.append('search', searchTerm);
      if (category) params.append('category', category);
      
      const response = await fetch(`/api/consolidated?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar materiais da biblioteca');
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 3,
  });
}

// === HOOKS PARA RELATÓRIOS ===

// Hook para dados de performance detalhados
export function useReportsPerformance(userId: string = 'demo-user', period: string = '7d') {
  return useQuery({
    queryKey: ['reports-performance', userId, period],
    queryFn: async () => {
      const response = await fetch(`/api/reports/performance?userId=${encodeURIComponent(userId)}&period=${period}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar dados de performance');
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 3,
    enabled: Boolean(userId),
  });
}

// Hook para dados de especialidades
export function useReportsSpecialties(userId: string = 'demo-user') {
  return useQuery({
    queryKey: ['reports-specialties', userId],
    queryFn: async () => {
      const response = await fetch(`/api/consolidated?action=reports-specialties&userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar dados de especialidades');
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }
      return data.specialtyData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 3,
    enabled: Boolean(userId),
  });
}

// Hook para metas e objetivos
export function useReportsGoals(userId: string = 'demo-user') {
  return useQuery({
    queryKey: ['reports-goals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/consolidated?action=reports-goals&userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar dados de metas');
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }
      return data.weeklyGoals;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 3,
    enabled: Boolean(userId),
  });
}

// Função helper para invalidar cache do usuário
export function invalidateUserData(userId: string, queryClient: any) {
  queryClient.invalidateQueries({ queryKey: ['user-stats', userId] });
  queryClient.invalidateQueries({ queryKey: ['user-activity', userId] });
  queryClient.invalidateQueries({ queryKey: ['user-progress', userId] });
  queryClient.invalidateQueries({ queryKey: ['user-achievements', userId] });
  queryClient.invalidateQueries({ queryKey: ['reports-performance', userId] });
  queryClient.invalidateQueries({ queryKey: ['reports-specialties', userId] });
  queryClient.invalidateQueries({ queryKey: ['reports-goals', userId] });
}
