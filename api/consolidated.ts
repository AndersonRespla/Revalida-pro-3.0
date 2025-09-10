import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'user-stats':
        return await handleUserStats(req, res);
      case 'user-progress':
        return await handleUserProgress(req, res);
      case 'user-activity':
        return await handleUserActivity(req, res);
      case 'user-achievements':
        return await handleUserAchievements(req, res);
      case 'library-materials':
        return await handleLibraryMaterials(req, res);
      case 'reports-goals':
        return await handleReportsGoals(req, res);
      case 'reports-specialties':
        return await handleReportsSpecialties(req, res);
      case 'sessions-save':
        return await handleSessionsSave(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error in consolidated API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleUserStats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  // Nota: Para evitar falhas enquanto o banco não está totalmente configurado,
  // retornamos um objeto de estatísticas coerente com o esperado no frontend
  // (useUserStats). Quando as tabelas estiverem prontas, substituir por queries reais.

  const stats = {
    progressPercentage: 0,
    nextGoalPercentage: 85,
    studyTimeThisWeek: 0,
    totalSessions: 0,
    averageScore: 0,
    ranking: null as number | null,
    totalUsers: 1,
    percentile: 0,
    achievements: 0,
    sessionsThisWeek: 0,
  };

  return res.status(200).json({ ok: true, stats });
}

async function handleUserProgress(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  // Implementar lógica de progresso do usuário
  const progress = {
    currentLevel: 1,
    experiencePoints: 0,
    nextLevelPoints: 100
  };

  return res.status(200).json({ ok: true, progress });
}

async function handleUserActivity(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  // Implementar lógica de atividade do usuário
  const activities = [];

  return res.status(200).json({ ok: true, activities });
}

async function handleUserAchievements(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  // Implementar lógica de conquistas do usuário
  const achievements = [];

  return res.status(200).json({ ok: true, achievements });
}

async function handleLibraryMaterials(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Implementar lógica de materiais da biblioteca
  const materials = [];

  return res.status(200).json({ ok: true, materials });
}

async function handleReportsSpecialties(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  // Implementar lógica de relatórios de especialidades
  const specialties = [];

  return res.status(200).json({ ok: true, specialtyData: specialties });
}

async function handleReportsGoals(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  // Implementar lógica de relatórios de metas
  const goals = [];

  return res.status(200).json({ ok: true, weeklyGoals: goals });
}

async function handleSessionsSave(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionData } = req.body;
  if (!sessionData) {
    return res.status(400).json({ error: 'Missing sessionData' });
  }

  // Implementar lógica de salvamento de sessão
  return res.status(200).json({ ok: true, sessionId: 'temp-id' });
}
