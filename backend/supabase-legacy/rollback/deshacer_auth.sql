-- DESHACER las migraciones 1–3 (solo si algo salió mal).
-- Devuelve appointments a como estaba (RLS apagado) y borra perfiles y funciones.
-- No borra cuentas de auth.users ni citas.

drop function if exists public.cancelar_cita_por_token(text);
drop function if exists public.cancelar_mi_cita(text);
drop function if exists public.horas_ocupadas(text, date);

drop index if exists public.appointments_horario_unico;
drop policy if exists "citas: admin todo" on public.appointments;
drop policy if exists "citas: cliente ve las suyas" on public.appointments;
drop policy if exists "citas: cliente crea las suyas" on public.appointments;
alter table public.appointments disable row level security;
grant select, insert, update, delete on table public.appointments to anon;
alter table public.appointments alter column user_id drop default;
-- La columna user_id se conserva para no perder datos; bórrala a mano si quieres:
-- alter table public.appointments drop column user_id;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop trigger if exists profiles_updated_at on public.profiles;
drop function if exists public.profiles_touch_updated_at();
drop policy if exists "perfil: leer el propio o admin" on public.profiles;
drop policy if exists "perfil: editar el propio" on public.profiles;
drop function if exists public.is_admin();
drop table if exists public.profiles;
