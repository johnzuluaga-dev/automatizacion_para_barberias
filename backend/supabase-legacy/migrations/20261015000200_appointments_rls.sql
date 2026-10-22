-- =============================================================================
-- 2 · Citas con dueño y RLS
-- Hoy public.appointments tiene RLS APAGADO: la clave pública puede leer
-- (y probablemente modificar) todas las citas. Esta migración:
--   · agrega user_id (las 32 citas existentes quedan con user_id vacío)
--   · activa RLS: el cliente ve y crea solo las suyas; el admin ve y edita todo
--   · quita todo acceso a la clave anónima
--   · impide dos citas activas en el mismo barbero/día/hora
-- Requiere la migración 1 (is_admin).
-- Importante: si en el futuro n8n escribe en esta tabla, debe usar la
-- service_role key (en el servidor), que no se ve afectada por RLS.
-- =============================================================================

alter table public.appointments
  add column if not exists user_id uuid references auth.users (id) on delete set null;

alter table public.appointments alter column user_id set default auth.uid();
create index if not exists appointments_user_id_idx on public.appointments (user_id);

-- Nuevas citas desde la app entran como pendientes.
alter table public.appointments alter column status set default 'pending';

-- Valores por defecto defensivos (solo si la columna no tiene uno).
do $$
declare
  col record;
begin
  for col in
    select column_name, data_type, column_default, is_nullable
    from information_schema.columns
    where table_schema = 'public' and table_name = 'appointments'
      and column_name in ('cancel_token', 'reminder_sent', 'visits_count', 'created_at')
  loop
    if col.column_default is not null then
      continue;
    end if;
    if col.column_name = 'cancel_token' then
      if col.data_type = 'uuid' then
        execute 'alter table public.appointments alter column cancel_token set default gen_random_uuid()';
      else
        execute 'alter table public.appointments alter column cancel_token set default gen_random_uuid()::text';
      end if;
    elsif col.column_name = 'reminder_sent' then
      execute 'alter table public.appointments alter column reminder_sent set default false';
    elsif col.column_name = 'visits_count' and col.is_nullable = 'NO' then
      execute 'alter table public.appointments alter column visits_count set default 1';
    elsif col.column_name = 'created_at' then
      execute 'alter table public.appointments alter column created_at set default now()';
    end if;
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.appointments enable row level security;

drop policy if exists "citas: admin todo" on public.appointments;
create policy "citas: admin todo"
  on public.appointments for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "citas: cliente ve las suyas" on public.appointments;
create policy "citas: cliente ve las suyas"
  on public.appointments for select to authenticated
  using (user_id = (select auth.uid()));

-- El cliente solo crea citas propias, pendientes, futuras, de lunes a sábado
-- y dentro del horario (11:00 a 19:30, turnos de 30 min).
drop policy if exists "citas: cliente crea las suyas" on public.appointments;
create policy "citas: cliente crea las suyas"
  on public.appointments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and appointment_date::date >= current_date
    and extract(isodow from appointment_date::date) <> 7
    and appointment_time::time between time '11:00' and time '19:30'
    and extract(minute from appointment_time::time) in (0, 30)
  );

-- Los clientes no editan ni borran directamente: cancelan con cancelar_mi_cita().
revoke all on table public.appointments from anon;

-- -----------------------------------------------------------------------------
-- Una sola cita activa por barbero/día/hora.
-- Si falla con "could not create unique index", hay duplicados: ver 01_precheck.
-- -----------------------------------------------------------------------------
create unique index if not exists appointments_horario_unico
  on public.appointments (barber, appointment_date, appointment_time)
  where status <> 'cancelled';
