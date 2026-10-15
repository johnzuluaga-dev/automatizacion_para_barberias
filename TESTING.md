# Pruebas — Frontend BarberFlow

Pruebas del frontend (`barberflow/`) con **Vitest** y **React Testing Library** en `jsdom`. Ninguna prueba llama a Supabase ni a n8n: se simulan con `vi.mock`.

## Cómo ejecutarlas

```bash
cd barberflow
npm test            # una sola corrida
npm run test:watch  # modo observación
npm run check       # typecheck + lint + pruebas + build
```

## Archivos

| Archivo | Qué cubre |
|---|---|
| `test/auth.test.tsx` | Registro (validación, contraseña de 10+, términos, envío), verificación (6 casillas, `one-time-code`, pegar código, código vencido, reenviar a los 60 s), inicio de sesión (contraseña, credenciales incorrectas, cuenta sin verificar, entrar con código), recuperación (mensaje genérico, código de recuperación, enlace vencido, nueva contraseña) y rutas protegidas por rol. |
| `test/BookingForm.test.tsx` | Reserva sin sesión (pide ingresar y conserva la selección), domingos bloqueados, 18 turnos de 11:00 a 19:30, validación, creación de la cita pendiente con datos del perfil, horas ocupadas y choque de horario. |
| `test/App.test.tsx` | Rutas, 404, panel de admin (listar, confirmar, filtrar, error y reintento) y cancelación por enlace. |
| `test/ui.test.tsx`, `test/ui-auth.test.tsx` | Componentes base: botón, campo de texto, toasts, `OtpInput`, medidor de contraseña. |
| `test/a11y.test.tsx` | axe-core sobre reserva, ingresar, registro, verificación, recuperación, Mis citas, cancelar y admin. |

## Dobles de prueba

- `test/mocks/auth-api.ts` reemplaza `src/features/auth/auth-api.ts`: sesión controlable con `setTestSession({ role })` y funciones espía (`signUp`, `verifyEmailCode`, …).
- `test/mocks/render.tsx` renderiza la app completa en una ruta con `renderAt('/ruta', state)`.
- La fecha del sistema se fija en las pruebas de reserva (`vi.setSystemTime`) para que no dependan del día.

## Notas

- Las rutas usan `React.lazy`; `test/setup.ts` sube el tiempo de espera a 10 s para la primera importación en frío.
- jsdom no calcula estilos: el contraste de color se verificó aparte sobre los tokens (todos los pares cumplen AA).
