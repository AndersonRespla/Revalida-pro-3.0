# 🎯 PLANO DE IMPLEMENTAÇÃO - SIMULAÇÃO OSCE COMPLETA

## 📊 **STATUS ATUAL - O QUE JÁ ESTÁ IMPLEMENTADO**

### ✅ **Funcionalidades Implementadas:**
1. **Sorteio básico de estações** - `/api/simulation/run` busca 5 estações aleatórias
2. **Persistência básica** - Salva em `simulations` e `simulation_stations`
3. **View stations_with_criteria** - Existe e inclui critérios das estações
4. **Frontend básico** - SimulationExam.tsx carrega estações
5. **Schema SQL** - Tabelas `simulations` e `simulation_stations` criadas
6. **Integração ElevenLabs** - Componente `elevenlabs-convai` configurado
7. **Sistema de gravação** - MediaRecorder implementado
8. **Transcrição básica** - OpenAI Whisper integrado

---

## 🚧 **IMPLEMENTAÇÕES NECESSÁRIAS**

### **1. SORTEIO VERDADEIRO + PERSISTÊNCIA 📦**
**Status:** ⚠️ Parcialmente implementado
**Prioridade:** 🔴 ALTA

#### **O que falta:**
- [ ] Usar `stations_with_criteria` em vez de `stations` diretamente
- [ ] Adicionar parâmetro `seed` opcional para reprodutibilidade
- [ ] Retornar `criteria` no response JSON
- [ ] Garantir que não há repetição de estações

#### **Arquivos a modificar:**
- `api/simulation/run.ts` - Atualizar query para usar view
- `supabase/simulations.sql` - Adicionar campo `metadata` para seed

---

### **2. BALANCEAMENTO OPCIONAL POR ESPECIALIDADE ⚖️**
**Status:** ❌ Não implementado
**Prioridade:** 🟡 MÉDIA

#### **O que implementar:**
- [ ] Parâmetro `specialty_quota` no endpoint
- [ ] Lógica de seleção balanceada por especialidade
- [ ] Fallback para seleção aleatória global
- [ ] Salvar distribuição usada em `simulations.metadata`

#### **Arquivos a criar/modificar:**
- `api/simulation/run.ts` - Adicionar lógica de balanceamento
- `supabase/simulations.sql` - Adicionar campo `metadata` JSON

---

### **3. INJEÇÃO DE CONTEXTO NO MODERADOR ELEVENLABS 🧠**
**Status:** ⚠️ Parcialmente implementado
**Prioridade:** 🔴 ALTA

#### **O que falta:**
- [ ] Criar payload de contexto privado no backend
- [ ] Mapeamento "station N → target_agent_id"
- [ ] Ajustar frontend para não exibir detalhes das estações
- [ ] Atributo privado `stations-context` no componente

#### **Arquivos a modificar:**
- `api/simulation/run.ts` - Criar contexto privado
- `src/pages/SimulationExam.tsx` - Ocultar detalhes das estações
- `src/pages/SimulationExam.tsx` - Atributo privado no elevenlabs-convai

---

### **4. TRANSFERÊNCIA ENTRE AGENTES (HANDOFF) 🔄**
**Status:** ❌ Não implementado
**Prioridade:** 🔴 ALTA

#### **O que implementar:**
- [ ] Função de orquestração para handoff
- [ ] API de transferência para `agent_patient_(N+1)`
- [ ] Envio de resumo da estação N
- [ ] Logs em `simulation_events`
- [ ] Retry exponencial (3 tentativas)
- [ ] Fallback para moderador humano

#### **Arquivos a criar:**
- `api/simulation/handoff.ts` - Endpoint para transferência
- `api/simulation/events.ts` - Logs de eventos
- `supabase/simulation_events.sql` - Schema para eventos

---

### **5. GRAVAÇÃO + TRANSCRIÇÃO POR ESTAÇÃO 🎙️**
**Status:** ⚠️ Parcialmente implementado
**Prioridade:** 🔴 ALTA

#### **O que falta:**
- [ ] Salvar áudio no Supabase Storage por estação
- [ ] Transcrição vinculada aos critérios
- [ ] Campo `keywords` para termos-chave
- [ ] Detecção de idioma

#### **Arquivos a modificar:**
- `api/audio/finish.ts` - Salvar por estação
- `api/transcribe.ts` - Vincular a critérios
- `supabase/transcripts.sql` - Schema atualizado

---

### **6. FEEDBACK AUTOMÁTICO BASEADO NA RUBRICA (PEP) 🧾**
**Status:** ❌ Não implementado
**Prioridade:** 🔴 ALTA

#### **O que implementar:**
- [ ] Endpoint `/api/feedback/generate`
- [ ] Nota ponderada por critério (0-10)
- [ ] Justificativa baseada na transcrição
- [ ] Score final por estação e global
- [ ] Salvar em `feedback` com breakdown JSON

#### **Arquivos a criar:**
- `api/feedback/generate.ts` - Geração de feedback
- `supabase/feedback.sql` - Schema para feedback

---

### **7. DETECÇÃO DE VOZ "SOLICITO <EXAME>" 🧪**
**Status:** ⚠️ Parcialmente implementado
**Prioridade:** 🟡 MÉDIA

#### **O que falta:**
- [ ] Normalizar variações (ECG/"eletro", RX/"raio x")
- [ ] Dicionário de normalização
- [ ] Log em `simulation_events`

#### **Arquivos a modificar:**
- `api/voice-commands/detect.ts` - Normalização
- `api/exams/release.ts` - Log de eventos

---

### **8. REPRISE/RETOMADA DE SIMULAÇÃO ▶️**
**Status:** ❌ Não implementado
**Prioridade:** 🟡 MÉDIA

#### **O que implementar:**
- [ ] Endpoint `/api/simulation/continue`
- [ ] Carregar estado atual
- [ ] Reativar agente ou voltar ao moderador
- [ ] Continuidade garantida

#### **Arquivos a criar:**
- `api/simulation/continue.ts` - Retomada de simulação

---

### **9. SEGURANÇA E RLS 🔒**
**Status:** ❌ Não implementado
**Prioridade:** 🟡 MÉDIA

#### **O que implementar:**
- [ ] Ativar RLS nas tabelas de simulação
- [ ] Políticas de acesso por usuário
- [ ] Políticas para admin
- [ ] Manter `stations` públicas

#### **Arquivos a modificar:**
- `supabase/simulations.sql` - Ativar RLS e políticas

---

### **10. TELEMETRIA & CUSTOS 💸**
**Status:** ❌ Não implementado
**Prioridade:** 🟢 BAIXA

#### **O que implementar:**
- [ ] Métricas por estação (duração, latência)
- [ ] Tokens/segundos e custo estimado
- [ ] Salvar em `simulation_metrics`
- [ ] Dashboard em `/simulation/metrics`

#### **Arquivos a criar:**
- `api/simulation/metrics.ts` - Coleta de métricas
- `src/pages/SimulationMetrics.tsx` - Dashboard de métricas
- `supabase/simulation_metrics.sql` - Schema para métricas

---

### **11. FAIL-SAFES E TIMEOUTS ⏱️**
**Status:** ❌ Não implementado
**Prioridade:** 🔴 ALTA

#### **O que implementar:**
- [ ] Timeout (20s) para APIs críticas
- [ ] Retry exponencial com jitter
- [ ] Circuit breaker simples
- [ ] Logs estruturados

#### **Arquivos a modificar:**
- `api/simulation/run.ts` - Timeouts e retry
- `api/simulation/handoff.ts` - Circuit breaker
- `lib/circuit-breaker.ts` - Implementação do circuit breaker

---

### **12. TESTES DE FUMAÇA (E2E "MODO SIMULADO") 🧪**
**Status:** ❌ Não implementado
**Prioridade:** 🟢 BAIXA

#### **O que implementar:**
- [ ] Comando `npm run simulate:mock`
- [ ] Modo simulado para agentes e transcrição
- [ ] Simulação completa (5 estações)
- [ ] Sumário final

#### **Arquivos a criar:**
- `scripts/simulate-mock.js` - Simulação mockada
- `package.json` - Script de comando

---

### **13. UI DO ALUNO (APENAS PROGRESSO) 🎛️**
**Status:** ⚠️ Parcialmente implementado
**Prioridade:** 🔴 ALTA

#### **O que falta:**
- [ ] Esconder detalhes das estações
- [ ] Mostrar apenas: cronômetro, barra 1→5, botão "Solicitar exame"
- [ ] Status de upload/transcrição
- [ ] Tela de feedback final

#### **Arquivos a modificar:**
- `src/pages/SimulationExam.tsx` - Ocultar spoilers
- `src/components/SimulationProgress.tsx` - Componente de progresso
- `src/components/SimulationFeedback.tsx` - Feedback final

---

### **14. UI DO ADMIN (CURADORIA) 🧑‍⚕️**
**Status:** ❌ Não implementado
**Prioridade:** 🟡 MÉDIA

#### **O que implementar:**
- [ ] Página `/admin/simulations/:id`
- [ ] Lista de estações, transcrições, exames
- [ ] Edição manual de notas
- [ ] Export PDF da simulação

#### **Arquivos a criar:**
- `src/pages/AdminSimulation.tsx` - Página de admin
- `api/admin/simulation-export.ts` - Export PDF

---

### **15. BRIEFING PARA CALL COM ELEVENLABS 📞**
**Status:** ❌ Não implementado
**Prioridade:** 🔴 ALTA

#### **O que implementar:**
- [ ] Documento de briefing em inglês
- [ ] Caso de uso: simulação OSCE médica
- [ ] Stack atual e integrações
- [ ] Perguntas para alinhamento

#### **Arquivos a criar:**
- `docs/elevenlabs-briefing.md` - Briefing para call

---

## 📋 **CHECKLIST FINAL**

### **🔴 CRÍTICO (Implementar primeiro):**
- [ ] `/api/simulation/run` com `stations_with_criteria` e seed
- [ ] Contexto privado para moderador ElevenLabs
- [ ] Handoff entre agentes com logs
- [ ] Gravação + transcrição por estação
- [ ] Feedback automático baseado em rubrica
- [ ] Fail-safes e timeouts
- [ ] UI do aluno sem spoilers

### **🟡 IMPORTANTE (Implementar depois):**
- [ ] Balanceamento por especialidade
- [ ] Detecção de voz melhorada
- [ ] Reprise/retomada de simulação
- [ ] Segurança e RLS
- [ ] UI do admin

### **🟢 DESEJÁVEL (Implementar por último):**
- [ ] Telemetria e custos
- [ ] Testes de fumaça E2E
- [ ] Briefing ElevenLabs

---

## 🚀 **ORDEM DE IMPLEMENTAÇÃO RECOMENDADA**

### **Fase 1 - Core (Semana 1):**
1. Atualizar `/api/simulation/run` com `stations_with_criteria`
2. Implementar contexto privado para ElevenLabs
3. Criar sistema de handoff entre agentes
4. Implementar fail-safes e timeouts

### **Fase 2 - Funcionalidades (Semana 2):**
5. Gravação + transcrição por estação
6. Feedback automático baseado em rubrica
7. UI do aluno sem spoilers
8. Detecção de voz melhorada

### **Fase 3 - Robustez (Semana 3):**
9. Reprise/retomada de simulação
10. Segurança e RLS
11. Balanceamento por especialidade
12. UI do admin

### **Fase 4 - Otimização (Semana 4):**
13. Telemetria e custos
14. Testes de fumaça E2E
15. Briefing ElevenLabs
16. Documentação final

---

## 📊 **MÉTRICAS DE SUCESSO**

- ✅ **5 estações diferentes** sorteadas sem repetição
- ✅ **Contexto privado** enviado ao moderador
- ✅ **Handoff automático** entre 5 agentes
- ✅ **Gravação completa** de todas as estações
- ✅ **Feedback automático** baseado em critérios
- ✅ **UI limpa** sem spoilers para o aluno
- ✅ **Robustez** com timeouts e retry
- ✅ **Segurança** com RLS ativo

---

**🎯 Objetivo:** Simulação OSCE completa e robusta, igual ao dia da prova real!
