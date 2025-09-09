-- =====================================================
-- TABELAS PARA ESTAÇÕES OSCE - REVALIDA AI COACH
-- =====================================================

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

-- =====================================================
-- TABELA: stations (estações OSCE)
-- =====================================================
create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Informações básicas
  name text not null,
  specialty text not null,
  code text not null unique,
  
  -- Informações de simulação
  participant_info text not null,
  actor_info text not null,
  
  -- Exames disponíveis
  available_exams text not null,
  available_exams_image text, -- URL da imagem no Supabase Storage
  
  -- Metadados
  is_active boolean not null default true,
  difficulty_level text check (difficulty_level in ('básico', 'intermediário', 'avançado')) default 'intermediário',
  estimated_duration int not null default 10, -- em minutos
  
  -- Relacionamentos
  created_by uuid, -- referência ao usuário que criou
  tags text[] -- array de tags para categorização
);

-- Índices para performance
create index if not exists idx_stations_specialty on public.stations (specialty);
create index if not exists idx_stations_active on public.stations (is_active);
create index if not exists idx_stations_difficulty on public.stations (difficulty_level);
create index if not exists idx_stations_created_by on public.stations (created_by);

-- Trigger para updated_at
drop trigger if exists trg_stations_updated_at on public.stations;
create trigger trg_stations_updated_at
  before update on public.stations
  for each row execute function public.set_updated_at();

-- =====================================================
-- TABELA: station_criteria (critérios de avaliação)
-- =====================================================
create table if not exists public.station_criteria (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Relacionamento com estação
  station_id uuid not null references public.stations(id) on delete cascade,
  
  -- Dados do critério
  name text not null,
  description text not null,
  weight numeric(5,2) not null check (weight >= 0 and weight <= 100), -- peso em porcentagem
  order_index int not null, -- ordem de exibição
  
  -- Metadados
  is_required boolean not null default true,
  max_score numeric(5,2) default 10.0, -- pontuação máxima para o critério
  
  -- Validação: peso total deve ser 100% por estação
  constraint unique_station_order unique (station_id, order_index)
);

-- Índices
create index if not exists idx_station_criteria_station on public.station_criteria (station_id);
create index if not exists idx_station_criteria_order on public.station_criteria (station_id, order_index);

-- Trigger para updated_at
drop trigger if exists trg_station_criteria_updated_at on public.station_criteria;
create trigger trg_station_criteria_updated_at
  before update on public.station_criteria
  for each row execute function public.set_updated_at();

-- =====================================================
-- FUNÇÃO: Validar peso total dos critérios = 100%
-- =====================================================
create or replace function validate_station_criteria_weight()
returns trigger as $$
declare
  total_weight numeric(5,2);
begin
  -- Calcular peso total para a estação
  select coalesce(sum(weight), 0) into total_weight
  from public.station_criteria
  where station_id = coalesce(new.station_id, old.station_id);
  
  -- Verificar se está próximo de 100% (tolerância de 0.01%)
  if abs(total_weight - 100.0) > 0.01 then
    raise exception 'Peso total dos critérios deve ser 100% (atual: %%)', total_weight;
  end if;
  
  return coalesce(new, old);
end;
$$ language plpgsql;

-- Triggers para validação de peso
drop trigger if exists trg_validate_criteria_weight_insert on public.station_criteria;
create trigger trg_validate_criteria_weight_insert
  after insert on public.station_criteria
  for each row execute function validate_station_criteria_weight();

drop trigger if exists trg_validate_criteria_weight_update on public.station_criteria;
create trigger trg_validate_criteria_weight_update
  after update on public.station_criteria
  for each row execute function validate_station_criteria_weight();

drop trigger if exists trg_validate_criteria_weight_delete on public.station_criteria;
create trigger trg_validate_criteria_weight_delete
  after delete on public.station_criteria
  for each row execute function validate_station_criteria_weight();

-- =====================================================
-- DADOS DE EXEMPLO
-- =====================================================

-- Estação 1: Cardiologia
insert into public.stations (name, specialty, code, participant_info, actor_info, available_exams, difficulty_level, tags) values (
  'Estação Cardiologia - Dor Torácica',
  'Cardiologia',
  'CARD-001',
  'Avaliar paciente com dor torácica. Realizar anamnese completa focando em características da dor, fatores de risco cardiovascular e exame físico cardiovascular detalhado. Solicitar exames apropriados e estabelecer hipóteses diagnósticas.',
  'Paciente masculino, 58 anos, com dor torácica há 2 horas, de caráter opressivo, irradiando para braço esquerdo e mandíbula. Histórico de hipertensão arterial, diabetes mellitus tipo 2 e tabagismo. Relata sudorese fria e náuseas.',
  'ECG de 12 derivações, RX de tórax, Enzimas cardíacas (CK-MB, Troponina), Hemograma completo, Glicemia de emergência',
  'intermediário',
  array['cardiologia', 'dor torácica', 'síndrome coronariana aguda', 'emergência']
);

-- Critérios para Estação Cardiologia
insert into public.station_criteria (station_id, name, description, weight, order_index, max_score) values
  ((select id from public.stations where code = 'CARD-001'), 'Anamnese', 'História clínica completa com foco em características da dor, fatores de risco e sintomas associados', 25.00, 1, 10.0),
  ((select id from public.stations where code = 'CARD-001'), 'Exame Físico', 'Ausculta cardíaca e pulmonar, palpação de pulsos, verificação de sinais de insuficiência cardíaca', 30.00, 2, 10.0),
  ((select id from public.stations where code = 'CARD-001'), 'Diagnóstico', 'Hipóteses diagnósticas baseadas em achados clínicos e solicitação de exames apropriados', 25.00, 3, 10.0),
  ((select id from public.stations where code = 'CARD-001'), 'Conduta', 'Plano terapêutico imediato, incluindo medidas de estabilização e encaminhamento adequado', 20.00, 4, 10.0);

-- Estação 2: Pneumologia
insert into public.stations (name, specialty, code, participant_info, actor_info, available_exams, difficulty_level, tags) values (
  'Estação Pneumologia - Dispneia',
  'Pneumologia',
  'PNEU-001',
  'Avaliar paciente com dispneia progressiva. Realizar anamnese respiratória detalhada, exame físico pulmonar e cardiovascular. Identificar possíveis causas e solicitar exames complementares apropriados.',
  'Paciente feminina, 45 anos, com dispneia progressiva há 3 dias, associada a tosse produtiva com secreção amarelada, febre baixa (37.8°C) e dor torácica pleurítica. Histórico de asma na infância.',
  'RX de tórax (PA e perfil), Espirometria, Gasometria arterial, Hemograma completo, Proteína C reativa',
  'básico',
  array['pneumologia', 'dispneia', 'infecção respiratória', 'asma']
);

-- Critérios para Estação Pneumologia
insert into public.station_criteria (station_id, name, description, weight, order_index, max_score) values
  ((select id from public.stations where code = 'PNEU-001'), 'Anamnese Respiratória', 'História detalhada da dispneia, sintomas associados e histórico respiratório', 30.00, 1, 10.0),
  ((select id from public.stations where code = 'PNEU-001'), 'Exame Físico', 'Ausculta pulmonar, percussão, verificação de sinais de consolidação ou derrame', 35.00, 2, 10.0),
  ((select id from public.stations where code = 'PNEU-001'), 'Diagnóstico Diferencial', 'Lista de possíveis causas da dispneia baseada nos achados clínicos', 20.00, 3, 10.0),
  ((select id from public.stations where code = 'PNEU-001'), 'Investigação', 'Solicitação de exames complementares apropriados para confirmação diagnóstica', 15.00, 4, 10.0);

-- Estação 3: Gastroenterologia
insert into public.stations (name, specialty, code, participant_info, actor_info, available_exams, difficulty_level, tags) values (
  'Estação Gastroenterologia - Dor Abdominal',
  'Gastroenterologia',
  'GAST-001',
  'Avaliar paciente com dor abdominal aguda. Realizar anamnese detalhada, exame físico abdominal completo e identificar sinais de alarme. Estabelecer diagnóstico diferencial e conduta adequada.',
  'Paciente masculino, 32 anos, com dor abdominal há 6 horas, inicialmente periumbilical e migrando para fossa ilíaca direita. Náuseas, vômitos e febre baixa (37.5°C). Dor piora com movimento e tosse.',
  'Hemograma completo, Amilase e Lipase, RX de abdome simples, Ultrassom abdominal, Tomografia computadorizada',
  'intermediário',
  array['gastroenterologia', 'dor abdominal', 'apendicite aguda', 'abdome agudo']
);

-- Critérios para Estação Gastroenterologia
insert into public.station_criteria (station_id, name, description, weight, order_index, max_score) values
  ((select id from public.stations where code = 'GAST-001'), 'Anamnese Abdominal', 'História detalhada da dor, localização, características e sintomas associados', 25.00, 1, 10.0),
  ((select id from public.stations where code = 'GAST-001'), 'Exame Físico Abdominal', 'Inspeção, ausculta, percussão e palpação abdominal sistemática', 35.00, 2, 10.0),
  ((select id from public.stations where code = 'GAST-001'), 'Sinais de Alarme', 'Identificação de sinais que indicam gravidade e necessidade de intervenção urgente', 20.00, 3, 10.0),
  ((select id from public.stations where code = 'GAST-001'), 'Diagnóstico e Conduta', 'Hipóteses diagnósticas e plano de investigação/tratamento', 20.00, 4, 10.0);

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para estações com critérios
create or replace view public.stations_with_criteria as
select 
  s.*,
  json_agg(
    json_build_object(
      'id', sc.id,
      'name', sc.name,
      'description', sc.description,
      'weight', sc.weight,
      'order_index', sc.order_index,
      'is_required', sc.is_required,
      'max_score', sc.max_score
    ) order by sc.order_index
  ) as criteria
from public.stations s
left join public.station_criteria sc on s.id = sc.station_id
where s.is_active = true
group by s.id;

-- View para estatísticas das estações
create or replace view public.stations_stats as
select 
  specialty,
  count(*) as total_stations,
  avg(estimated_duration) as avg_duration,
  array_agg(distinct difficulty_level) as difficulty_levels
from public.stations
where is_active = true
group by specialty;

-- =====================================================
-- POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- =====================================================

-- Habilitar RLS nas tabelas
-- alter table public.stations enable row level security;
-- alter table public.station_criteria enable row level security;

-- Exemplo de política para usuários autenticados
-- create policy "Users can view active stations" on public.stations
--   for select using (is_active = true);

-- create policy "Users can view station criteria" on public.station_criteria
--   for select using (true);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para buscar estação por código
create or replace function get_station_by_code(station_code text)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'station', row_to_json(s),
    'criteria', (
      select json_agg(row_to_json(sc) order by sc.order_index)
      from public.station_criteria sc
      where sc.station_id = s.id
    )
  ) into result
  from public.stations s
  where s.code = station_code and s.is_active = true;
  
  return result;
end;
$$ language plpgsql;

-- Função para calcular pontuação total de uma estação
create or replace function calculate_station_total_score(station_uuid uuid)
returns numeric as $$
declare
  total_score numeric;
begin
  select sum(max_score) into total_score
  from public.station_criteria
  where station_id = station_uuid;
  
  return coalesce(total_score, 0);
end;
$$ language plpgsql;
