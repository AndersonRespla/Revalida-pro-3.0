import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Construir histórico da conversa
    const messages = [
      {
        role: 'system' as const,
        content: `Você é um assistente médico especializado em preparação para o exame Revalida. 
        Forneça respostas precisas, baseadas em evidências e adequadas para estudantes de medicina.
        Sempre mencione quando uma informação é específica para o contexto brasileiro.
        Se não tiver certeza sobre algo, seja honesto e sugira consultar fontes oficiais.`
      },
      ...conversationHistory,
      {
        role: 'user' as const,
        content: message
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return res.status(500).json({ error: 'No response from OpenAI' });
    }

    return res.status(200).json({ 
      ok: true, 
      response 
    });

  } catch (error) {
    console.error('Error in chatgpt:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}