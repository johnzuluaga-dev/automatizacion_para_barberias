# Pruebas — Frontend BarberFlow

Pruebas del frontend (`barberflow/`) con **Vitest** y **React Testing Library** en un entorno `jsdom`.

## Cómo ejecutarlas

```bash
cd barberflow
npm test            # una sola corrida
npm run test:watch  # modo observación
npm run check       # typecheck + lint + pruebas + build
```

## Herramientas

| Herramienta | Uso |
|---|---|
| Vitest 5 | Runner de pruebas (comparte la configuración de Vite) |
| React Testing Library 16 | Renderizado y consultas accesibles del DOM |
| @testing-library/user-event 14 | Interacciones reales: clics, teclado, escritura |
| @testing-library/jest-dom 7 | Matchers como `toBeDisabled` o `toHaveAccessibleDescription` |

La configuración está en `vite.config.ts` (bloque `test`) y en `test/setup.ts`.

## Archivos

### `test/BookingForm.test.tsx` — Reserva de citas

La fecha del sistema se fija en **miércoles 14 de octubre de 2026, 9:00** (`vi.setSystemTime`), así las pruebas no dependen del día en que se ejecutan. La versión anterior fallaba porque usaba una fecha fija que ya había pasado.

| Prueba | Qué valida |
|---|---|
| renderiza el formulario correctamente | Título, campos de nombre y teléfono, botón **Agendar Cita** |
| permite escribir en los inputs | Los campos reflejan lo que escribe el usuario |
| bloquea los domingos | El domingo aparece como "cerrado" y deshabilitado |
| ofrece turnos de 30 minutos… | 18 turnos de 11:00 a 19:30, deshabilitados hasta elegir día |
| muestra errores y no envía si faltan datos | Mensajes por campo y resumen; no se llama a n8n |
| envía el formulario con el mismo contrato… | Payload exacto hacia n8n (incluye `price`) y pantalla **¡Cita Confirmada!** |
| muestra el error del servicio si n8n falla | Alerta con el mensaje de error; el botón vuelve a estar disponible |

### `test/App.test.tsx` — Rutas y pantallas

| Prueba | Qué valida |
|---|---|
| `/` muestra la pantalla de reservas | Carga perezosa de la ruta principal |
| `/admin` sin sesión redirige al login | Ruta protegida por `sessionStorage` |
| una ruta desconocida muestra 404 | Página de no encontrado |
| rechaza credenciales incorrectas | Mensaje de error y sin sesión |
| lista las citas y calcula las métricas | Datos de Supabase (simulado) y cálculo de ingresos |
| confirma una cita pendiente | Llama a `updateAppointmentStatus` y muestra notificación |
| filtra por estado | Filtro de la agenda |
| muestra error y permite reintentar | Estado de error y botón **Reintentar** |
| cancelar cita sin id / con id | Botón deshabilitado sin id; flujo simulado con id |

### `test/ui.test.tsx` — Componentes base

Estado de carga del botón, asociación accesible de label y error en `TextField`, y notificaciones (`useToast`).

## Notas

- `src/lib/n8n` y `src/lib/supabase` se simulan con `vi.mock`: las pruebas nunca llaman al backend real.
- Las rutas usan `React.lazy`; `test/setup.ts` sube el `asyncUtilTimeout` a 5 s para la primera importación en frío.
