import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_message',
        details: 'Mensagem é obrigatória'
      });
    }

    const history = conversationHistory && Array.isArray(conversationHistory)
      ? conversationHistory
          .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-10)
      : [];

    const messages: any[] = [
      {
        role: 'system',
        content: `Você é um assistente médico especializado em preparação para o exame Revalida. 
        Forneça respostas precisas, baseadas em evidências e adequadas para estudantes de medicina.
        Sempre mencione quando uma informação é específica para o contexto brasileiro.
        Se não tiver certeza sobre algo, seja honesto e sugira consultar fontes oficiais.`
      },
      ...history,
      {
        role: 'user',
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
      if (err.code === 'model_not_found' || err.message?.includes('gpt-4o-mini')) {
        console.log('Tentando fallback para gpt-3.5-turbo');
        completion = await complete('gpt-3.5-turbo');
      } else {
        throw err;
      }
    }

    const response = completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

    return res.status(200).json({
      ok: true,
      response: response,
      usage: completion.usage
    });

  } catch (error: any) {
    console.error('Erro no ChatGPT:', error);
    
    return res.status(500).json({ 
      ok: false, 
      error: 'openai_error',
      details: error.message || 'Erro na API do OpenAI'
    });
  }
}
