import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
  }
  const openai = new OpenAI({ apiKey });

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { message, conversationHistory = [] } = payload as { message?: string; conversationHistory?: Array<{ role: string; content: string }>; };

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Construir histórico da conversa (sanitizado e truncado)
    const history = Array.isArray(conversationHistory)
      ? conversationHistory
          .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-10)
      : [];

    const messages = [
      {
        role: 'system' as const,
        content: `Você é um assistente médico especializado em preparação para o exame Revalida. 
        Forneça respostas precisas, baseadas em evidências e adequadas para estudantes de medicina.
        Sempre mencione quando uma informação é específica para o contexto brasileiro.
        Se não tiver certeza sobre algo, seja honesto e sugira consultar fontes oficiais.`
      },
      ...history,
      {
        role: 'user' as const,
        content: message
      }
    ];

    async function complete(model: string) {
      return openai.chat.completions.create({
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });
    }

    let completion;
    try {
      completion = await complete('gpt-4o-mini');
    } catch (err: any) {
      // Fallback de modelo para contas que não possuem acesso
      if (String(err?.message || '').toLowerCase().includes('model')) {
        completion = await complete('gpt-3.5-turbo');
      } else {
        throw err;
      }
    }

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return res.status(500).json({ error: 'No response from OpenAI' });
    }

    return res.status(200).json({ 
      ok: true, 
      response 
    });

  } catch (error: any) {
    const message = String(error?.message || 'Internal server error');
    const status = Number((error as any)?.status || 500);
    console.error('Error in chatgpt:', message);
    return res.status(Math.max(400, Math.min(status, 500))).json({ ok: false, error: 'chatgpt_failed', message });
  }
}