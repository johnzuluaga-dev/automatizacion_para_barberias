# Diseño de datos de BarberFlow en Firestore

Plan Spark (sin Cloud Functions). Todo lo "automático" lo hace n8n con una cuenta de servicio.
Archivos de esta carpeta: firestore.rules, firestore.indexes.json, seed/, scripts/.

## 1. Qué entendí del proyecto

App React de reservas para una barbería (lunes a sábado, 11:00 a 20:00, turnos de 30 min).
Antes de la migración solo existían appointments y profiles en Supabase; barberos y servicios eran listas fijas en
catalog.ts y las citas los guardaban como texto. Cuando se reserva, n8n debe confirmar por WhatsApp,
recordar antes de la cita y avisar cancelaciones. Después se agregará un chatbot de WhatsApp que reserva solo.

## 2. Colecciones (Firestore no tiene tablas ni JOINs)

| Colección | Para qué sirve | Relaciones |
|---|---|---|
| perfiles/{uid} | Nombre, teléfono E.164, avatar, rol (copia informativa; la autoridad es el claim del token) | uid = ID de Firebase Auth |
| sedes/{id} | Sede(s) del negocio (una por ahora) | la referencian barberos y citas |
| barberos/{id} | Nombre, foto, activo, *servicioIds[]* (= barbero_servicios) y *orden* (para listar), *horarioSemanal* (= horarios_barbero; mapa día→lista de {desde, hasta}, sin arreglos anidados), embebidos | sedeId, perfilId (si tiene login) |
| servicios/{id} | Nombre, duración, precio | referenciado por barberos y citas |
| bloqueos_barbero/{id} | Vacaciones, descansos, días libres (inicio, fin, motivo) | barberoId |
| citas/{id} | La reserva: cliente, barbero, sede, inicio/fin (Timestamp), estado, *servicios[]* embebidos con precio congelado (= cita_servicios), cancelación | clienteId (vacío si vino del chatbot), barberoId, sedeId |
| citas_slots/{barbero_fecha_hhmm} | Un doc por cupo de 30 min. Su ID único impide la doble reserva | citaId |
| recordatorios/{id} | Aviso programado (programadoPara, canal, estado, intentos) | citaId |
| notificaciones_log/{id} | Qué se envió por WhatsApp, respuesta y error | citaId |
| eventos_n8n/{id} | Webhooks enviados y su resultado | citaId (opcional) |
| resenas/{citaId} | Calificación 1 a 5 tras la cita (ID = cita: una por cita) | citaId, barberoId, clienteId |
| conversaciones_whatsapp/{telefono} | Estado del chatbot (paso, borrador de reserva) | por teléfono |
| configuracion/negocio | Zona horaria, intervalo de turno, anticipación del recordatorio (recordatorioMinutosAntes, configurable) | — |

Total: 13 colecciones. barbero_servicios, horarios_barbero y cita_servicios se *embeben*: son listas
pequeñas que siempre se leen junto al documento padre y así se ahorran lecturas (el plan gratis da 50.000 al día).
Sin pagos: el código no los justifica.

### Campos clave de citas
clienteId, clienteNombre, clienteTelefono (+57…), barberoId, barberoNombre, sedeId,
fecha ("yyyy-MM-dd"), horaInicio ("HH:mm"), inicio/fin (Timestamp UTC; Colombia es UTC-5 sin horario de verano),
estado (pendiente | confirmada | completada | cancelada | no_asistio), notas,
servicios[{servicioId, nombre, precio, duracionMin}], precioTotal, origen (web | whatsapp | admin),
cancelToken, slotIds, canceladaEn, canceladaPor (cliente | barbero | admin | sistema), motivoCancelacion,
createdAt, updatedAt.

### Cómo se evita la doble reserva
Postgres lo hacía con un constraint de exclusión. En Firestore, la web y n8n escriben en *un solo batch*:
la cita y un citas_slots por cada media hora que ocupa (un servicio de 60 min = 2 cupos).
El ID es barberoId_fecha_hhmm, así que si el cupo ya existe la segunda escritura falla completa.
n8n lo hace con el endpoint REST documents:commit y la condición currentDocument.exists = false
(el nodo de Firestore de n8n no hace transacciones). Al cancelar se borran los cupos (sus IDs quedan en slotIds de la cita).

### Qué sustituye a RLS
firestore.rules y los custom claims (rol, barberoId) que asigna scripts/asignar_rol.mjs.
Cliente: ve y cancela solo lo suyo. Barbero: ve y gestiona sus citas. Admin: todo.
n8n usa cuenta de servicio y se salta las reglas.

## 3. Límites que debes conocer
- *Reglas sin probar.* Las escribí sin ejecutarlas. Pruébalas con el emulador antes de producción.
- *Cloud Storage (fotos y avatares).* Los proyectos nuevos de Firebase piden Blaze para usarlo (verifícalo en tu consola).
  Con Spark, guarda fotoUrl apuntando a una URL externa (por ejemplo imágenes en public/ o un servicio de imágenes gratuito).
- *Reglas no pueden verificar todo.* Un cliente malicioso podría crear una cita sin sus cupos o con un precioTotal falso.
  Si quieres cerrar eso, las reservas pasan solo por n8n (la web llama al webhook y las reglas niegan create de citas).
  Costo: si n8n está caído no se reserva.
- *WhatsApp.* Un recordatorio fuera de las 24 h desde el último mensaje del cliente requiere una plantilla aprobada en la API de WhatsApp Business.
- *Moneda.* Los precios del seed (15, 25, 10, 30) son los del código actual; las duraciones de 60 min para "Corte + Barba" y "Tratamiento Facial" son supuestos míos.

## 4. Flujos de n8n

*A. Reserva desde la web* (webhook nueva_cita, payload con citaId).
1. Lee la cita en Firestore; valida que exista y esté pendiente.
2. Lee configuracion/negocio y crea un recordatorios por cada valor de recordatorioMinutosAntes (omite los que ya pasaron).
3. Envía por WhatsApp la confirmación (fecha, hora, barbero, enlace /cancel?id=<cancelToken>).
4. Escribe notificaciones_log y eventos_n8n (éxito o error).

*B. Recordatorios* (Schedule Trigger cada 5 a 10 min).
1. Consulta recordatorios con estado == 'pendiente' y programadoPara <= ahora.
2. Por cada uno lee la cita; si ya no está pendiente/confirmada, marca el recordatorio cancelado.
3. Envía el WhatsApp, marca enviado o fallido (con intentos) y escribe el log.

*C. Cancelación.*
- Desde la web/admin/barbero: la cita pasa a cancelada con canceladaEn y canceladaPor; se borran los cupos.
  (Pendiente): el webhook cita_cancelada que avisa a n8n para cancelar los recordatorios y notificar por WhatsApp todavía no está implementado.
- Desde el enlace sin sesión: CancelPage llama a un webhook de n8n con el token; n8n busca la cita por cancelToken, la cancela y libera los cupos (así no se necesita Cloud Functions).

*D. Chatbot de WhatsApp (flujo aparte).*
1. Webhook de WhatsApp recibe el mensaje; lee/crea conversaciones_whatsapp/{telefono}.
2. Pregunta servicio, barbero y fecha; calcula disponibilidad leyendo horarioSemanal, bloqueos_barbero y citas_slots.
3. Reserva con el mismo commit atómico del punto "doble reserva", con origen: 'whatsapp' y clienteId: null.
4. Dispara el flujo A para confirmación y recordatorios.

## 5. Cambios realizados en el código React (migración ya completada)

1. Se reemplazó @supabase/supabase-js por el SDK de Firebase; el cliente está en [firebase.ts](../../frontend/src/lib/firebase.ts), las citas en [citas.ts](../../frontend/src/lib/citas.ts) y la autenticación en [auth-api.ts](../../frontend/src/features/auth/auth-api.ts).
2. Barberos y servicios se leen de Firestore ([catalogo.ts](../../frontend/src/lib/catalogo.ts)); las citas guardan ids (barberoId, servicios[]) y no nombres sueltos.
3. Estados en español (pendiente, confirmada, completada, cancelada, no_asistio) en status.ts, STATUS_META, computeStats y los tests. Roles admin | barbero | cliente.
4. Se reserva con el batch cita + cupos; useTakenSlots lee citas_slots; la doble reserva se detecta por el fallo de la escritura.
5. [schedule.ts](../../frontend/src/features/booking/schedule.ts) usa horarioSemanal del barbero, bloqueos_barbero y la duración del servicio.
6. El teléfono se normaliza a +57… en validation.ts.
7. Cancelación: se guardan canceladaEn y canceladaPor; CancelPage llama al webhook de n8n con el token.
8. RequireAuth y la sesión leen el rol del claim del token; hay una página para el barbero con sus citas.
9. n8n.ts: el payload lleva citaId en vez de los datos sueltos.
10. La verificación por correo pasó del código de 6 dígitos a enlace.
11. Reseñas: pantalla nueva para calificar citas completadas.

## 6. Datos de Supabase
No se migra nada: Firebase arranca desde cero, sin usuarios ni citas previas.