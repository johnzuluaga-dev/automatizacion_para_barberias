-- =============================================================================
-- 3 · Funciones de reserva y cancelación
-- Exponen solo lo necesario sin abrir la tabla:
--   · horas_ocupadas: qué horas están tomadas (sin nombres ni teléfonos)
--   · cancelar_mi_cita: el cliente cancela una cita suya
--   · cancelar_cita_por_token: cancelar desde el enlace /cancel?id=<token>
-- =============================================================================

create or replace function public.horas_ocupadas(p_barbero text, p_fecha date)
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select left(a.appointment_time::text, 5)
  from public.appointments a
  where a.barber = p_barbero
    and a.appointment_date::date = p_fecha
    and a.status <> 'cancelled';
$$;

revoke all on function public.horas_ocupadas(text, date) from public;
grant execute on function public.horas_ocupadas(text, date) to anon, authenticated;

-- -----------------------------------------------------------------------------
create or replace function public.cancelar_mi_cita(p_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  afectadas integer;
begin
  update public.appointments
  set status = 'cancelled'
  where id::text = p_id
    and user_id = (select auth.uid())
    and status in ('pending', 'confirmed')
    and appointment_date::date >= current_date;
  get diagnostics afectadas = row_count;
  return afectadas > 0;
end;
$$;

revoke all on function public.cancelar_mi_cita(text) from public;
grant execute on function public.cancelar_mi_cita(text) to authenticated;

-- -----------------------------------------------------------------------------
create or replace function public.cancelar_cita_por_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  afectadas integer;
begin
  if p_token is null or length(p_token) < 16 then
    return false;
  end if;
  update public.appointments
  set status = 'cancelled'
  where cancel_token::text = p_token
    and status in ('pending', 'confirmed')
    and appointment_date::date >= current_date;
  get diagnostics afectadas = row_count;
  return afectadas > 0;
end;
$$;

revoke all on function public.cancelar_cita_por_token(text) from public;
grant execute on function public.cancelar_cita_por_token(text) to anon, authenticated;
