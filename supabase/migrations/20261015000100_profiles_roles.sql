-- =============================================================================
-- 1 · Perfiles y roles
-- Crea public.profiles (1 fila por usuario de auth), el trigger que la llena al
-- registrarse y la función is_admin() que usan las políticas RLS.
-- Nadie puede cambiarse el rol desde la app: solo se cambia por SQL.
-- =============================================================================

create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text,
  phone             text,
  role              text not null default 'client' check (role in ('admin', 'client')),
  terms_accepted_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.profiles is 'Datos públicos de cada cuenta y su rol (admin | client).';

alter table public.profiles enable row level security;

-- -----------------------------------------------------------------------------
-- ¿El usuario actual es admin? (security definer para poder leer profiles
-- desde las políticas sin recursión de RLS)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- Políticas: cada quien lee y edita su perfil; el admin lee todos.
-- -----------------------------------------------------------------------------
drop policy if exists "perfil: leer el propio o admin" on public.profiles;
create policy "perfil: leer el propio o admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "perfil: editar el propio" on public.profiles;
create policy "perfil: editar el propio"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Solo se pueden editar nombre y celular; el rol queda fuera de alcance de la app.
revoke all on table public.profiles from anon;
revoke insert, update, delete on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, phone) on table public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.profiles_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.profiles_touch_updated_at();

-- -----------------------------------------------------------------------------
-- Al registrarse: crear el perfil con los datos del formulario.
-- El rol SIEMPRE empieza como 'client' (se ignora cualquier rol enviado).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  terms text := new.raw_user_meta_data ->> 'terms_accepted_at';
begin
  insert into public.profiles (id, full_name, phone, terms_accepted_at)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    case when terms ~ '^\d{4}-\d{2}-\d{2}T' then terms::timestamptz end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cuentas que ya existieran antes de esta migración.
insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data ->> 'full_name'
from auth.users u
on conflict (id) do nothing;
