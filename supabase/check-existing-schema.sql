-- =====================================================
-- SCRIPT PARA VERIFICAR O QUE JÁ EXISTE NO BANCO
-- =====================================================

-- 1. Verificar se as tabelas existem
SELECT 
    'TABELA' as tipo,
    table_name as nome,
    'EXISTE' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('simulations', 'simulation_stations', 'stations', 'station_criteria')
ORDER BY table_name;

-- 2. Verificar colunas da tabela simulations (se existir)
SELECT 
    'COLUNA' as tipo,
    'simulations.' || column_name as nome,
    data_type as tipo_dado,
    is_nullable as nullable,
    column_default as default_value
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'simulations'
ORDER BY ordinal_position;

-- 3. Verificar colunas da tabela simulation_stations (se existir)
SELECT 
    'COLUNA' as tipo,
    'simulation_stations.' || column_name as nome,
    data_type as tipo_dado,
    is_nullable as nullable,
    column_default as default_value
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'simulation_stations'
ORDER BY ordinal_position;

-- 4. Verificar colunas da tabela stations (se existir)
SELECT 
    'COLUNA' as tipo,
    'stations.' || column_name as nome,
    data_type as tipo_dado,
    is_nullable as nullable,
    column_default as default_value
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'stations'
ORDER BY ordinal_position;

-- 5. Verificar constraints existentes
SELECT 
    'CONSTRAINT' as tipo,
    tc.constraint_name as nome,
    tc.table_name as tabela,
    tc.constraint_type as tipo_constraint
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public' 
AND tc.table_name IN ('simulations', 'simulation_stations')
ORDER BY tc.table_name, tc.constraint_name;

-- 6. Verificar índices existentes
SELECT 
    'INDEX' as tipo,
    indexname as nome,
    tablename as tabela
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('simulations', 'simulation_stations')
ORDER BY tablename, indexname;

-- 7. Verificar funções existentes
SELECT 
    'FUNCTION' as tipo,
    routine_name as nome,
    routine_type as tipo_funcao
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%simulation%'
ORDER BY routine_name;

-- 8. Verificar triggers existentes
SELECT 
    'TRIGGER' as tipo,
    trigger_name as nome,
    event_object_table as tabela
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('simulations', 'simulation_stations')
ORDER BY event_object_table, trigger_name;
