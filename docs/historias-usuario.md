# 📋 Historias de Usuario – BarberFlow

Basadas en las funcionalidades documentadas (`README.md`, `Arquitectura.md`) y en el código real del repositorio `automatizacion_para_barberias` (`BookingForm.tsx`, `CancelAppointment.tsx`, `Login.tsx`, `AdminDashboard.tsx`, `lib/n8n.ts`, `lib/supabase.ts`).

---

## Épica 1: Agendamiento de Citas

### HU-01 – Agendar una cita
**Como** cliente,
**quiero** agendar una cita a través del formulario web,
**para** reservar un turno en la barbería sin necesidad de llamar o escribir por WhatsApp.

**Campos:**
- `client_name` (texto libre) — Nombre completo del cliente. Obligatorio. Sin validación de formato.
- `client_phone` (texto libre, input tipo teléfono) — Teléfono/WhatsApp del cliente. Obligatorio. Sin validación de formato ni cantidad de dígitos.
- `service` (lista desplegable, texto) — Servicio a contratar. Obligatorio. Opciones fijas: Corte Clásico ($15), Corte + Barba ($25), Perfilado de Barba ($10), Tratamiento Facial ($30).
- `barber` (lista desplegable, texto) — Barbero asignado. Obligatorio. Opciones fijas: Carlos The Blade, Andrés Estilo, Juan Classic.
- `appointment_date` (fecha, formato `AAAA-MM-DD`) — Fecha de la cita. Obligatorio. No permite fechas anteriores a hoy.
- `appointment_time` (hora, formato `HH:MM`) — Hora de la cita. Obligatorio. Sin restricción de horario de atención.
- `price` (numérico, calculado automáticamente) — Se obtiene según el `service` seleccionado; no lo digita el cliente.

**Criterios de aceptación:**
- El formulario permite ingresar nombre completo y teléfono.
- El cliente puede seleccionar un servicio y un barbero disponibles.
- El cliente puede elegir fecha y hora dentro de los horarios disponibles.
- Al enviar el formulario, los datos se envían al backend mediante un webhook (n8n).
- Se muestra un mensaje de confirmación ("¡Cita Confirmada!") tras el envío exitoso.
- Si el envío falla, se muestra un mensaje de error.

---

### HU-02 – Ver horarios disponibles
**Como** cliente,
**quiero** ver la disponibilidad de horarios antes de agendar,
**para** elegir un turno que se ajuste a mi tiempo.

**Campos:**
- `appointment_date` (fecha) — Restringido a fechas iguales o posteriores a hoy mediante el atributo `min` del selector.
- `appointment_time` (hora) — Selector libre de hora; actualmente no filtra horarios ya ocupados.

**Criterios de aceptación:**
- El selector de fecha no permite elegir días pasados.
- El cliente puede elegir libremente cualquier hora del día (no hay bloqueo por horario de atención ni por citas ya existentes).
- *(Pendiente de mejora)*: filtrar horarios ya reservados según los datos de Supabase.

---

### HU-03 – Cancelar una cita
**Como** cliente,
**quiero** cancelar una cita ya agendada a través de un enlace,
**para** liberar el horario si no puedo asistir.

**Campos:**
- `appointmentId` (texto, tomado del parámetro `id` en la URL) — Identifica la cita a cancelar. Obligatorio para ejecutar la cancelación.

**Criterios de aceptación:**
- El cliente accede a la cancelación mediante un enlace con el `id` de su cita.
- Se pide confirmación antes de cancelar ("¿Estás seguro...?").
- Se muestra un estado de carga mientras se procesa.
- Se muestra un mensaje de éxito al finalizar.
- *(Pendiente de implementación real)*: actualmente la cancelación es una simulación y no actualiza el estado de la cita en Supabase.

---

## Épica 2: Notificaciones

### HU-04 – Recibir confirmación por WhatsApp
**Como** cliente,
**quiero** recibir una confirmación por WhatsApp al agendar mi cita,
**para** tener la certeza de que mi reserva fue registrada correctamente.

**Campos (payload enviado a n8n):**
- `tipo_evento` (texto fijo) — Siempre `"nueva_cita"`.
- `client_name`, `client_phone`, `service`, `barber`, `appointment_date`, `appointment_time`, `price` — mismos datos capturados en HU-01.
- `timestamp` (texto, formato ISO 8601) — Fecha/hora del envío del formulario.
- `source` (texto fijo) — Siempre `"BarberFlow Web"`.

**Criterios de aceptación:**
- Al guardarse la cita, n8n dispara el envío de un mensaje de WhatsApp.
- El mensaje incluye fecha, hora, servicio y barbero asignado.
- El envío ocurre de forma automática, sin intervención manual.
- *(Nota: el flujo de envío vive en n8n, fuera del código de este repositorio; no se puede verificar su implementación exacta desde el frontend).*

---

### HU-05 – Recibir recordatorio antes de la cita
**Como** cliente,
**quiero** recibir un recordatorio automático antes de mi cita,
**para** no olvidar mi turno y reducir inasistencias.

**Campos:**
- `appointment_date` y `appointment_time` — usados por n8n para calcular el momento de envío del recordatorio.
- `client_phone` — número de destino del recordatorio.

**Criterios de aceptación:**
- El sistema envía un recordatorio por WhatsApp en un tiempo previo configurado antes de la cita.
- El recordatorio incluye los datos principales de la cita (hora, servicio, barbero).
- *(Nota: al igual que HU-04, este flujo depende de n8n y no está en el código del frontend).*

---

### HU-06 – Recibir notificación de cancelación
**Como** cliente,
**quiero** recibir una notificación cuando mi cita sea cancelada,
**para** estar al tanto del estado de mi reserva.

**Campos:**
- `appointmentId` / `client_phone` — datos necesarios para identificar la cita y notificar al cliente correcto.

**Criterios de aceptación:**
- Al cancelarse una cita, se envía un mensaje automático por WhatsApp al cliente.
- El mensaje indica claramente que la cita fue cancelada.
- *(Nota: depende de que HU-03 esté completamente implementada; actualmente la cancelación es simulada, por lo que esta notificación tampoco se dispara realmente).*

---

## Épica 3: Administración del Negocio

### HU-07 – Iniciar sesión como administrador
**Como** administrador,
**quiero** iniciar sesión con usuario y contraseña,
**para** acceder de forma restringida al panel administrativo.

**Campos:**
- `username` (texto libre) — Obligatorio. 
- `password` (texto, oculto con opción de mostrar/ocultar) — Obligatorio. 

**Criterios de aceptación:**
- Ambos campos son obligatorios para enviar el formulario.
- Si las credenciales son correctas, se guarda la sesión y se redirige al panel administrativo.
- Si son incorrectas, se muestra el mensaje "Usuario o contraseña incorrectos."
- *(Nota de seguridad: las credenciales están fijadas en variables del frontend, sin backend de autenticación real).*

---

### HU-08 – Gestionar la agenda como administrador
**Como** administrador,
**quiero** ver y gestionar todas las citas agendadas,
**para** mantener el control de la operación diaria de la barbería.

**Campos mostrados por cada cita:**
- `client_name` (texto), `client_phone` (texto), `service` (texto), `barber` (texto), `appointment_date` (fecha), `appointment_time` (hora), `status` (uno de: pendiente, confirmada, completada, cancelada).

**Campos usados al cambiar el estado:**
- `id` (texto) — identifica la cita.
- `newStatus` (texto) — nuevo estado a asignar: `confirmed`, `completed` o `cancelled`.

**Criterios de aceptación:**
- El administrador puede ver todas las citas registradas, ordenadas por fecha y hora.
- El administrador puede confirmar, completar o cancelar una cita según su estado actual.
- El cambio de estado se guarda en Supabase y se refleja de inmediato en la tabla.
- Si no hay citas registradas, se muestra un mensaje indicándolo.
- Existe un botón para actualizar manualmente el listado.

---

### HU-09 – Visualizar estadísticas del negocio
**Como** administrador,
**quiero** visualizar un dashboard con estadísticas de citas y ventas,
**para** analizar el rendimiento de mi barbería.

**Campos (indicadores calculados):**
- `total` (numérico) — cantidad total de citas cargadas.
- `revenue` (numérico) — ingresos estimados; se calcula con una tarifa fija de $20 por cada cita confirmada o completada (no usa el precio real del servicio).
- `cancelled` (numérico) — cantidad de citas canceladas.
- `completed` (numérico) — cantidad de citas completadas.

**Criterios de aceptación:**
- El dashboard muestra los 4 indicadores en tarjetas resumen.
- Los valores se recalculan automáticamente al actualizar la lista de citas.
- *(Pendiente de mejora)*: calcular los ingresos con el precio real de cada servicio en lugar de una tarifa fija.

---

### HU-10 – Generar reportes automáticos
**Como** administrador,
**quiero** recibir reportes automáticos del negocio,
**para** tomar decisiones sin tener que calcular la información manualmente.

**Campos del reporte generado:**
- `id` (texto) — identificador generado a partir de la fecha/hora de creación.
- `week` (fecha) — fecha en que se generó el reporte.
- `summary` (texto largo) — resumen con conteo de citas confirmadas, completadas, canceladas e ingresos estimados.

**Criterios de aceptación:**
- El administrador puede generar un reporte manualmente desde el panel.
- El reporte incluye datos de ventas y citas gestionadas.
- *(Nota: actualmente el resumen se arma con una plantilla de texto fija a partir de los conteos, no con un análisis real de OpenAI como se describe en la Arquitectura del sistema).*

---

## Notas generales
- Estas historias de usuario se derivaron de las funcionalidades documentadas (`README.md`, `Arquitectura.md`) y del código fuente disponible en el repositorio.
- Las HU-04, HU-05 y HU-06 (notificaciones por WhatsApp) dependen del flujo interno de n8n, que no está incluido en este repositorio; sus criterios de aceptación se basan en lo descrito en la documentación, no en código verificado.
- Se recomienda validar cada HU contra el diagrama `casos de uso.jpg` para asegurar que no falte ningún actor o flujo.

---

## Notas
- Estas historias de usuario se derivaron de las funcionalidades ya documentadas (`README.md`, `Arquitectura.md`) y de los diagramas de casos de uso.
