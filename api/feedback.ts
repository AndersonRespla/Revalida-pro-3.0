import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }
  try {
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'missing_openai_key' });
    }

    const { simulationId, transcripts } = req.body || {} as { simulationId: string; transcripts: Record<number, string> };
    if (!simulationId || !transcripts) {
      return res.status(400).json({ ok: false, error: 'invalid_payload' });
    }

    // Prompt para comparar com gabarito ideal e produzir HTML com destaques
    const prompt = `Você é um avaliador OSCE. Compare as transcrições do aluno (3 estações) com o gabarito ideal de comunicação clínica (PEP/OSCE). Objetivo: gerar HTML mínimo. Regras:
- Destaque em <span class="ok">verde</span> palavras/expressões corretas usadas pelo aluno.
- Destaque em <span class="miss">vermelho</span> palavras/expressões importantes que faltaram.
- Para cada fala do aluno, sugira em uma linha "Sugestão:" como a(s) palavra(s) em vermelho poderiam ser encaixadas na frase original.
- Seja objetivo, bullets por estação. HTML simples, sem <html>/<body>, apenas <section> por estação.
- Classes CSS: .ok { color: #16a34a; font-weight: 600; } .miss { color: #dc2626; font-weight: 600; }
Transcrições: ${JSON.stringify(transcripts)}`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um avaliador OSCE experiente.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    });
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(500).json({ ok: false, error: 'feedback_error', detail: errText });
    }
    const json: any = await resp.json();
    const html = String(json?.choices?.[0]?.message?.content || '');

    // Persistir no Supabase (tabela feedbacks: simulation_id text, html text)
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('feedbacks').insert({ simulation_id: simulationId, html });
    } catch {}

    res.status(200).json({ ok: true, simulationId, feedbackHtml: html });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: 'server_error', detail: String(e?.message || e) });
  }
}
