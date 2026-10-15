-- Convierte una cuenta en administradora.
-- 1. Regístrate en la app con el correo que quieras usar como admin y verifícalo.
-- 2. Cambia el correo de abajo y ejecuta esto en el SQL Editor.

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'CAMBIA_ESTE_CORREO@ejemplo.com');

-- Para quitarle el rol:
-- update public.profiles set role = 'client'
-- where id = (select id from auth.users where email = 'CAMBIA_ESTE_CORREO@ejemplo.com');
