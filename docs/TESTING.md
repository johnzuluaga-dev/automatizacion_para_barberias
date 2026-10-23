# Pruebas — Frontend BarberFlow

Pruebas del frontend (frontend/) con *Vitest* y *React Testing Library* en jsdom. Ninguna prueba llama a Firebase ni a n8n: se simulan con vi.mock.

Son 8 archivos con 55 pruebas.

## Cómo ejecutarlas

bash
cd frontend
npm test            # una sola corrida
npm run test:watch  # modo observación
npm run check       # typecheck + lint + pruebas + build


## Archivos

| Archivo | Qué cubre |
|---|---|
| test/auth.test.tsx | Registro (validación, contraseña de 10+ caracteres, crear la cuenta, correo repetido), verificación del correo por enlace (aviso de correo sin verificar, reenviar a los 60 s, volver a donde iba al verificar), inicio de sesión (volver a la página de origen, credenciales incorrectas), recuperación de contraseña (mensaje genérico) y rutas protegidas por rol. |
| test/BookingForm.test.tsx | Reserva sin sesión (pide ingresar y conserva la selección), domingos bloqueados, 18 turnos de 11:00 a 19:30, validación, creación de la cita pendiente en Firestore con datos del perfil, correo sin verificar, horas ocupadas y choque de horario. |
| test/schedule.test.ts | Horario por barbero (tramos partidos, días libres, servicios de 60 min) y validación de la reserva con el catálogo. |
| test/agenda-resenas.test.tsx | Agenda del barbero (solo ve sus citas y cambia estados; un cliente no puede entrar) y calificar una cita completada. |
| test/App.test.tsx | Rutas, 404, panel de admin (listar, métricas, confirmar, filtrar, error y reintento) y cancelación por enlace. |
| test/ui.test.tsx, test/ui-auth.test.tsx | Componentes base: botón, campo de texto, toasts y medidor de contraseña. |
| test/a11y.test.tsx | axe-core sobre reserva, ingresar, registro, verificación, recuperación, Mis citas, cancelar y admin. |

## Dobles de prueba

- test/setup.ts reemplaza src/lib/firebase para que las pruebas no se conecten a un proyecto real de Firebase.
- test/mocks/auth-api.ts reemplaza src/features/auth/auth-api.ts: sesión controlable con setTestSession({ role }) y funciones espía (signUp, signInWithPassword, resendVerification, …).
- test/mocks/catalogo.ts reemplaza el catálogo de Firestore con servicios y barberos de prueba.
- test/mocks/render.tsx renderiza la app completa en una ruta con renderAt('/ruta', state).
- La fecha del sistema se fija en las pruebas de reserva (vi.setSystemTime) para que no dependan del día.

## Notas

- Las rutas usan React.lazy; test/setup.ts sube el tiempo de espera a 10 s para la primera importación en frío.
- jsdom no calcula estilos: el contraste de color se verificó aparte sobre los tokens (todos los pares cumplen AA).
- Las reglas de Firestore (backend/firebase/firestore.rules) todavía no tienen pruebas; se recomienda probarlas con el emulador.