import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente médico especializado em busca de informações médicas atualizadas.
          Forneça respostas baseadas em evidências científicas e diretrizes médicas atuais.
          Sempre mencione a fonte quando possível e seja específico sobre o contexto brasileiro quando relevante.`
        },
        {
          role: 'user',
          content: `Busque informações atualizadas sobre: ${query}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
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
    console.error('Error in chatgpt-web:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}