# Configuração do Supabase - Revalida AI Coach

## 🗄️ Tabelas Necessárias

### 1. Tabelas para Simulações (já existentes)
```sql
-- Execute primeiro o arquivo supabase_stations.sql
-- Este arquivo contém todas as tabelas para estações OSCE
```

### 2. Tabelas para Transcrições e Feedback
```sql
-- Extensões úteis
create extension if not exists "pgcrypto";

-- Função genérica para manter updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Tabela: transcripts
create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  simulation_id text not null,
  station int not null check (station between 1 and 3),
  transcript text not null,
  audio_path text,
  unique (simulation_id, station)
);

create index if not exists idx_transcripts_simulation
  on public.transcripts (simulation_id);

drop trigger if exists trg_transcripts_updated_at on public.transcripts;
create trigger trg_transcripts_updated_at
  before update on public.transcripts
  for each row execute function public.set_updated_at();

-- Tabela: feedbacks
create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  simulation_id text not null unique,
  html text not null
);
```

## 📋 Passos para Configuração

### 1. Acesse o Supabase
- Vá para [supabase.com](https://supabase.com)
- Acesse seu projeto

### 2. Execute os SQLs
- Vá para **SQL Editor**
- Execute primeiro o arquivo `supabase_stations.sql` completo
- Execute depois as tabelas de transcrições e feedback

### 3. Configure Storage
- Vá para **Storage**
- Crie um bucket chamado `recordings`
- Configure as políticas de acesso (opcional)

### 4. Verifique as Tabelas
- Vá para **Table Editor**
- Confirme que as seguintes tabelas foram criadas:
  - `stations` - Estações OSCE
  - `station_criteria` - Critérios de avaliação
  - `transcripts` - Transcrições de áudio
  - `feedbacks` - Feedback consolidado

## 🔐 Variáveis de Ambiente

No Vercel, configure:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

**Importante**: Use a **Service Role Key**, não a ANON_KEY, para as funções serverless.

## 📊 Estrutura das Tabelas

### Stations
- **id**: UUID único
- **name**: Nome da estação
- **specialty**: Especialidade médica
- **code**: Código único (ex: CARD-001)
- **participant_info**: Instruções para o aluno
- **actor_info**: Dados do paciente para o ator
- **available_exams**: Lista de exames disponíveis
- **available_exams_image**: URL da imagem (opcional)
- **difficulty_level**: básico/intermediário/avançado
- **tags**: Array de tags para categorização

### Station Criteria
- **station_id**: Referência à estação
- **name**: Nome do critério
- **description**: Descrição detalhada
- **weight**: Peso em porcentagem (deve somar 100%)
- **order_index**: Ordem de exibição
- **max_score**: Pontuação máxima

### Transcripts
- **simulation_id**: ID único da simulação
- **station**: Número da estação (1, 2 ou 3)
- **transcript**: Texto transcrito do áudio
- **audio_path**: Caminho do arquivo no Storage

### Feedbacks
- **simulation_id**: ID único da simulação
- **html**: Feedback em HTML com destaques

## 🚀 Dados de Exemplo

O arquivo `supabase_stations.sql` já inclui:
- 3 estações de exemplo (Cardiologia, Pneumologia, Gastroenterologia)
- Critérios com pesos para cada estação
- Dados realistas para simulações

## 🔍 Views Úteis

### stations_with_criteria
```sql
-- Retorna estações com seus critérios em JSON
select * from public.stations_with_criteria;
```

### stations_stats
```sql
-- Estatísticas por especialidade
select * from public.stations_stats;
```

## ⚠️ Validações Automáticas

- **Peso dos critérios**: Deve somar exatamente 100%
- **Ordem dos critérios**: Única por estação
- **Timestamps**: Atualizados automaticamente

## 🧪 Teste as Funcionalidades

1. **Página de Estações**: `/stations`
2. **Admin de Estações**: `/admin/stations`
3. **Simulação**: `/simulation`
4. **Verifique no Supabase**: Dados sendo salvos corretamente

## 🔒 Segurança (Opcional)

Para habilitar RLS (Row Level Security):
```sql
-- Descomente no arquivo supabase_stations.sql
-- alter table public.stations enable row level security;
-- alter table public.station_criteria enable row level security;
```

## 📞 Suporte

- **Documentação Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **SQL Editor**: Use para executar comandos e debugar
- **Logs**: Monitore as funções serverless no Vercel
