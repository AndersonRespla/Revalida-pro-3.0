# 🩺 Simulador OSCE com ElevenLabs Conversational AI

Script Node.js para executar simulações OSCE automatizadas, conectando ao Supabase para buscar estações e simulando transferências entre agentes da ElevenLabs.

## 🚀 Funcionalidades

- ✅ Conecta ao Supabase e busca 5 estações aleatórias
- ✅ Simula transferência entre 5 agentes (Paciente 1-5)
- ✅ Gera transcrições simuladas para cada estação
- ✅ Salva arquivos individuais (station1.txt, station2.txt...)
- ✅ Cria relatório final consolidado (feedback.txt)
- ✅ Suporte a variáveis de ambiente
- ✅ Logs detalhados do processo

## 📋 Pré-requisitos

- Node.js 16+ 
- Conta no Supabase com tabela `stations_with_criteria`
- API Key da ElevenLabs (para integração real)
- IDs dos agentes ElevenLabs configurados

## ⚙️ Instalação

1. **Clone ou baixe os arquivos**
```bash
cd scripts/
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
# Edite o arquivo .env com suas credenciais
```

## 🔧 Configuração

### Variáveis de Ambiente

Edite o arquivo `.env` com suas credenciais:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# IDs dos agentes (opcional)
ELEVENLABS_AGENT_1=agent_patient_1_id
ELEVENLABS_AGENT_2=agent_patient_2_id
# ... etc
```

### Configuração no Script

Edite o arquivo `simulation-runner.js` se necessário:

```javascript
// IDs dos agentes ElevenLabs (substitua pelos seus agentes)
const AGENT_IDS = [
  'agent_patient_1_id',  // Paciente 1
  'agent_patient_2_id',  // Paciente 2
  'agent_patient_3_id',  // Paciente 3
  'agent_patient_4_id',  // Paciente 4
  'agent_patient_5_id',  // Paciente 5
];

// Configurações da simulação
const SIMULATION_CONFIG = {
  totalStations: 5,      // Número de estações
  stationDuration: 10,   // Duração por estação (minutos)
  transferDelay: 2000,   // Delay entre transferências (ms)
  outputDir: './simulation-output' // Diretório de saída
};
```

## 🎯 Como Usar

### Execução Básica
```bash
npm start
```

### Com Nodemon (desenvolvimento)
```bash
npm run dev
```

### Com variáveis de ambiente específicas
```bash
SUPABASE_URL=your_url SUPABASE_KEY=your_key ELEVENLABS_API_KEY=your_key node simulation-runner.js
```

## 📁 Estrutura de Saída

O script cria o diretório `simulation-output/` com:

```
simulation-output/
├── station1.txt          # Transcrição da Estação 1
├── station2.txt          # Transcrição da Estação 2
├── station3.txt          # Transcrição da Estação 3
├── station4.txt          # Transcrição da Estação 4
├── station5.txt          # Transcrição da Estação 5
└── feedback.txt          # Relatório final consolidado
```

### Exemplo de station1.txt
```
ESTAÇÃO 1 - Estação Cardiologia - Dor Torácica
Especialidade: Cardiologia
Data: 2024-01-15T10:30:00.000Z
Agente: agent_patient_1_id
Duração: 10 minutos

INFORMAÇÕES AO PARTICIPANTE:
Avaliar paciente com dor torácica. Realizar anamnese completa...

INFORMAÇÕES AO ATOR:
Paciente masculino, 58 anos, com dor torácica há 2 horas...

EXAMES DISPONÍVEIS:
ECG de 12 derivações, RX de tórax, Enzimas cardíacas...

CRITÉRIOS DE AVALIAÇÃO:
[
  {
    "name": "Anamnese",
    "weight": 25.00,
    "description": "História clínica completa..."
  }
]

TRANSCRIÇÃO DA CONVERSA:
[2024-01-15T10:30:00.000Z] Médico: Olá, como posso ajudá-lo hoje?
[2024-01-15T10:30:05.000Z] Paciente: Tenho sentido uma dor no peito...
```

## 🔄 Fluxo de Execução

1. **Inicialização**
   - Verifica variáveis de ambiente
   - Cria diretório de saída
   - Conecta ao Supabase

2. **Busca de Estações**
   - Executa query: `SELECT * FROM stations_with_criteria WHERE is_active = true`
   - Embaralha resultados para simular `ORDER BY random()`
   - Limita a 5 estações

3. **Simulação por Estação**
   - Para cada estação:
     - Inicia interação com agente
     - Gera transcrição simulada
     - Transfere para próximo agente
     - Salva arquivo individual

4. **Relatório Final**
   - Consolida todas as transcrições
   - Gera estatísticas
   - Salva feedback.txt

## 🛠️ Integração com ElevenLabs (Real)

Para usar a API real da ElevenLabs, modifique a função `transferToNextAgent()`:

```javascript
async transferToNextAgent(currentAgentId, nextAgentId) {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agent-transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ELEVENLABS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        current_agent_id: currentAgentId,
        target_agent_id: nextAgentId,
        transfer_reason: 'station_complete'
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Transferência real concluída:', result);
    
  } catch (error) {
    console.error('❌ Erro na transferência real:', error.message);
    throw error;
  }
}
```

## 📊 Logs e Monitoramento

O script produz logs detalhados:

```
🚀 Iniciando Simulação OSCE com ElevenLabs Conversational AI
============================================================

📁 Diretório de saída criado: ./simulation-output
🔍 Buscando estações aleatórias do Supabase...
✅ 5 estações carregadas
   1. Estação Cardiologia - Dor Torácica (Cardiologia)
   2. Estação Pneumologia - Dispneia (Pneumologia)
   ...

📍 Processando Estação 1/5
==================================================
🎭 Iniciando interação com Agente 1 (agent_patient_1_id)
📋 Estação: Estação Cardiologia - Dor Torácica
⏱️  Duração: 10 minutos
🔄 Transferindo de agent_patient_1_id para agent_patient_2_id...
📡 Enviando transferência para ElevenLabs API...
✅ Transferência concluída
💾 Transcrição salva: station1.txt
```

## 🐛 Troubleshooting

### Erro de Conexão Supabase
```
❌ Erro na query Supabase: Invalid API key
```
**Solução**: Verifique `SUPABASE_URL` e `SUPABASE_KEY`

### Estações não encontradas
```
❌ Nenhuma estação ativa encontrada
```
**Solução**: Verifique se a tabela `stations` tem dados com `is_active = true`

### Erro de permissão de arquivo
```
❌ Erro ao criar diretório: EACCES
```
**Solução**: Execute com permissões adequadas ou mude o `outputDir`

## 🔮 Próximos Passos

- [ ] Integração real com ElevenLabs API
- [ ] Análise de sentimentos nas transcrições
- [ ] Sistema de scoring automático
- [ ] Interface web para monitoramento
- [ ] Exportação para diferentes formatos
- [ ] Integração com sistema de feedback da IA

## 📝 Licença

MIT License - Revalida Pro Team

## 🤝 Contribuição

Para contribuir com melhorias:
1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

---

**Desenvolvido com ❤️ para o futuro da educação médica** 🩺✨
