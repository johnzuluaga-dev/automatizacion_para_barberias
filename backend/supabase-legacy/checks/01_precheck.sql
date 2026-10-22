-- PRE-VERIFICACIÓN (solo lectura). Ejecuta esto ANTES de las migraciones.
-- Devuelve una sola tabla (el SQL Editor solo muestra el último resultado).
-- Revisa sobre todo:
--   · tipo "duplicado": dos citas activas en el mismo barbero/día/hora. Si aparece
--     alguna, cancela una antes de la migración 2 (el índice único fallaría).
--   · tipo "restricción": si existe un CHECK sobre status que no incluya 'pending'.

select 'columna' as tipo,
       column_name || ' · ' || data_type
         || coalesce(' · default ' || column_default, '')
         || ' · nulos ' || is_nullable as detalle
from information_schema.columns
where table_schema = 'public' and table_name = 'appointments'

union all
select 'rls',
       c.relname || ' = ' || case when c.relrowsecurity then 'activo' else 'APAGADO' end
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'

union all
select 'restricción', conname || ': ' || pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.appointments'::regclass

union all
select 'duplicado',
       barber || ' · ' || appointment_date::text || ' · ' || appointment_time::text || ' · ' || count(*) || ' citas'
from public.appointments
where status <> 'cancelled'
group by barber, appointment_date, appointment_time
having count(*) > 1

union all
select 'profiles', case when to_regclass('public.profiles') is null then 'no existe (se creará)' else 'YA EXISTE: avísame antes de seguir' end

union all
select 'usuarios auth', count(*)::text || ' cuentas registradas'
from auth.users;
