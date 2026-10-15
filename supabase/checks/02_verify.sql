-- VERIFICACIÓN (solo lectura). Ejecuta esto DESPUÉS de las 3 migraciones.
-- Todas las filas deberían decir "ok".

select 'profiles con RLS' as chequeo,
       case when relrowsecurity then 'ok' else 'FALTA' end as estado
from pg_class where oid = 'public.profiles'::regclass
union all
select 'appointments con RLS',
       case when relrowsecurity then 'ok' else 'FALTA' end
from pg_class where oid = 'public.appointments'::regclass
union all
select 'columna appointments.user_id',
       case when exists (select 1 from information_schema.columns
                         where table_schema = 'public' and table_name = 'appointments' and column_name = 'user_id')
            then 'ok' else 'FALTA' end
union all
select 'trigger de registro',
       case when exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then 'ok' else 'FALTA' end
union all
select 'políticas de appointments', count(*)::text || ' (esperadas: 3)'
from pg_policies where schemaname = 'public' and tablename = 'appointments'
union all
select 'anon sin acceso a appointments',
       case when has_table_privilege('anon', 'public.appointments', 'select') then 'REVISAR' else 'ok' end
union all
select 'funciones de reserva', count(*)::text || ' (esperadas: 4)'
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_admin', 'horas_ocupadas', 'cancelar_mi_cita', 'cancelar_cita_por_token')
union all
select 'administradores', count(*)::text || ' (mínimo 1 para usar el panel)'
from public.profiles where role = 'admin';
