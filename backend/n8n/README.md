# Workflows de n8n de BarberFlow

Copia de los workflows que corrían en el VPS anterior, para recrearlos en un servidor nuevo.
Las claves NO están aquí: viven solo en las credenciales de n8n.

## Archivos (`fuentes/`)

| Archivo | Workflow | Estado en el VPS anterior |
|---|---|---|
| `01-enviar-whatsapp.ts` | BarberFlow – Enviar WhatsApp (sub-workflow) | Activo |
| `02-notificaciones.snapshot-19-nodos.json` + `02-notificaciones.cambios-posteriores.json` | BarberFlow – Notificaciones WhatsApp | Activo |
| `03-consultar-disponibilidad.ts` (+ `.calcular.js`, versión final del nodo "Calcular disponibilidad") | Herramienta del chatbot | Sin publicar |
| `04-crear-cita.ts` | Herramienta del chatbot | Sin publicar |
| `05-cancelar-cita.ts` | Herramienta del chatbot | Sin publicar |
| `06-chatbot-whatsapp.ts` | BarberFlow – Chatbot WhatsApp | Sin publicar |

Los `.ts` son código del n8n Workflow SDK (se crean con `create_workflow_from_code` del MCP de n8n).
Las notificaciones se armaron por pasos: el snapshot es el estado de 19 nodos y el segundo JSON
son los cambios que se aplicaron después (webhooks que reciben solo `citaId` y leen la cita en Firestore).
`02-notificaciones.ts` es la versión final con los dos ya aplicados; los otros dos archivos quedan como historial.
El SDK no acepta funciones (`=>`) ni anotaciones de TypeScript fuera de los `jsCode`.

## Servidor actual (restaurado el 2026-10-23)

Los `.ts` ya tienen estos IDs. Evolution se llama por la red interna de Docker: `http://evolution:8080`.

| Workflow | ID |
|---|---|
| 01 Enviar WhatsApp | `rb3g0zW5WUW0e65C` |
| 02 Notificaciones WhatsApp | `sMU49dHmAeQwAMsq` |
| 03 Consultar disponibilidad | `xSSYOcWjlEE46jGg` |
| 04 Crear cita | `KwsrRqQVA2sMwB5u` |
| 05 Cancelar cita | `jJ39b81XFOYdVyVk` |
| 06 Chatbot WhatsApp | `qLyR825qB7lTXC9c` |

| Credencial (nombre en n8n) | ID |
|---|---|
| `evolution` (Header Auth `apikey`) | `kSbBkQdGat4M77BE` |
| `firebase` (Google Service Account) | `vivTIyFJ1BJ0SsKn` |
| `Gemini` | `yJlJHUjyklBA42Ha` |

## Restaurar en un servidor nuevo

1. Instalar n8n (versión actual) y Evolution API. Escanear el QR de la instancia `asistente`.
2. Crear en n8n las credenciales (con claves NUEVAS, ver "Seguridad"):
   - Evolution API: Header Auth, header `apikey`.
   - Firebase BarberFlow: Google Service Account, scope `https://www.googleapis.com/auth/datastore`.
   - BarberFlow Webhook Secret: Header Auth, header `x-barberflow-secret`.
   - Gemini BarberFlow: Google Gemini (PaLM) API.
3. Reemplazar en los archivos los IDs viejos por los nuevos:
   - Credenciales: `CnS8wNmGJjmVQ7EP` (Evolution), `FxYnlaVTc5j020oa` (Firebase),
     `cDF1WOxB1fsqUOVD` (Webhook Secret), `b4ECd4Tfb7xU51HS` (Gemini).
   - Workflows: `1wt4fUOjt1aHsaC7` (Enviar WhatsApp), `7yZXwhd0zVPnBwr8` (Consultar),
     `8t9SE8s9lW540U7P` (Crear cita), `E6s0omUWooWRIIk9` (Cancelar cita).
   - Si cambian los dominios: `https://evolutionapi.whatsappevolution.tech` en los `.ts`.
4. Crear en orden: 01 → 02 → 03 → 04 → 05 → 06 (cada uno usa el ID del anterior).
5. Probar con pin data, publicar y configurar el webhook de Evolution:
   `https://<n8n>/webhook/barberflow/whatsapp`, evento `MESSAGES_UPSERT`, "Webhook by Events" apagado.
6. Si cambia el dominio de n8n, actualizar en `frontend/.env`:
   `VITE_N8N_WEBHOOK_URL` y `VITE_N8N_CANCELLED_WEBHOOK_URL`.

Los datos (citas, perfiles, `configuracion/negocio`) están en Firestore y no se perdieron.

## Seguridad

El VPS anterior fue suspendido por actividad de botnet: hay que asumir que todo lo que estaba
guardado en él quedó expuesto. Antes de restaurar:

- Firebase: Google Cloud → IAM → Cuentas de servicio → borrar la clave usada por n8n y crear otra.
- Gemini: revocar la API key en Google AI Studio y crear otra.
- Evolution: usar una `apikey` global nueva.
- WhatsApp: en el celular, Dispositivos vinculados → cerrar la sesión del servidor viejo.
- Servidor nuevo: no reutilizar backups del VPS viejo, n8n actualizado, contraseña fuerte y
  firewall con solo 22 (idealmente con llave SSH) y 443 abiertos.
