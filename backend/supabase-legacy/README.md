# Supabase · Autenticación de BarberFlow

Guía para activar las cuentas reales. Todo se hace desde el panel de Supabase; la app no necesita ninguna clave secreta.

## 1. Ejecutar el SQL (en este orden)

En **SQL Editor → New query**, pega y ejecuta cada archivo, uno por uno:

| Paso | Archivo | Qué hace |
|---|---|---|
| 0 | `checks/01_precheck.sql` | Solo lectura. Muestra columnas, RLS, restricciones y citas duplicadas. Envíame el resultado si algo se ve raro. |
| 1 | `migrations/20261015000100_profiles_roles.sql` | Tabla `profiles`, roles `admin`/`client`, trigger al registrarse, función `is_admin()`. |
| 2 | `migrations/20261015000200_appointments_rls.sql` | `user_id` en `appointments`, RLS activo, sin acceso anónimo, una cita por barbero/día/hora. |
| 3 | `migrations/20261015000300_booking_functions.sql` | Horas ocupadas, cancelar mi cita, cancelar por enlace. |
| 4 | `checks/02_verify.sql` | Solo lectura. Todo debería decir `ok`. |

Si algo sale mal: `rollback/deshacer_auth.sql` devuelve todo a como estaba (no borra citas ni cuentas).

> El editor solo muestra el resultado de la **última** consulta de cada ejecución; por eso los chequeos devuelven una sola tabla.

### Crear el primer administrador

1. Regístrate en la app con el correo que será admin y verifícalo con el código.
2. Abre `snippets/hacer_admin.sql`, cambia el correo y ejecútalo.
3. Cierra sesión y vuelve a entrar: verás **Panel** en la barra superior.

## 2. Configuración del panel

### Authentication → Sign In / Providers → Email
- **Enable Email provider**: activado.
- **Confirm email**: activado (la cuenta se verifica con el código).
- **Email OTP Length**: `6`.
- **Email OTP Expiration**: `600` segundos (10 min) es un buen punto medio.
- **Minimum password length**: `10`.
- **Password requirements**: "Lowercase, uppercase letters and digits" (opcional, la app ya lo sugiere).

### Authentication → URL Configuration
- **Site URL**: `http://localhost:3000` por ahora. Cuando tengas dominio, cámbialo por el de producción.
- **Redirect URLs** (agrega ambas):
  - `http://localhost:3000/**`
  - `https://TU-DOMINIO/**` ← cuando lo tengas (por ejemplo el de Railway: `https://barberflow-production.up.railway.app/**`)

### Authentication → Rate Limits
Con el SMTP por defecto de Supabase el límite de correos por hora es **muy bajo** (pensado solo para pruebas). Configura un SMTP propio (abajo) antes de que se registren personas reales.

## 3. Correo (SMTP propio)

Recomendación: **Resend** (simple, plan gratis de 3.000 correos/mes, buena entregabilidad). Alternativa: **Brevo** (300 correos/día gratis).

1. Crea la cuenta en Resend y verifica un dominio (agrega los registros DNS que te indique: SPF y DKIM). Sin dominio propio solo puedes enviarte correos a ti mismo.
2. Crea una API key.
3. En Supabase → **Authentication → Emails → SMTP Settings**:
   - Host: `smtp.resend.com` · Puerto: `465` · Usuario: `resend` · Contraseña: tu API key
   - Sender email: `citas@TU-DOMINIO` · Sender name: `BarberFlow`
4. Sube el límite de correos en **Rate Limits** (por ejemplo 100/hora).

## 4. Plantillas de correo en español

En **Authentication → Emails → Templates**. La app usa el **código** (`{{ .Token }}`); el enlace queda como alternativa.

### Confirm signup
Asunto: `Tu código para BarberFlow: {{ .Token }}`
```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;color:#111111">
  <h2 style="margin:0 0 12px">Verifica tu correo</h2>
  <p>Escribe este código en BarberFlow para activar tu cuenta:</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0">{{ .Token }}</p>
  <p style="color:#6B675F">Vence en 10 minutos. Si no creaste una cuenta, ignora este correo.</p>
</div>
```

### Magic Link (entrar con código)
Asunto: `Tu código para entrar: {{ .Token }}`
```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;color:#111111">
  <h2 style="margin:0 0 12px">Tu código para entrar</h2>
  <p>Escribe este código en BarberFlow:</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0">{{ .Token }}</p>
  <p style="color:#6B675F">Vence en 10 minutos. Si no lo pediste, ignora este correo: tu cuenta sigue segura.</p>
</div>
```

### Reset Password
Asunto: `Recupera tu contraseña de BarberFlow`
```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;color:#111111">
  <h2 style="margin:0 0 12px">Crea una contraseña nueva</h2>
  <p>Abre este enlace desde el mismo dispositivo:</p>
  <p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1F4BFF;color:#ffffff;padding:12px 20px;border-radius:10px;text-decoration:none">Cambiar contraseña</a></p>
  <p>O escribe este código en la app:</p>
  <p style="font-size:28px;font-weight:bold;letter-spacing:8px;margin:16px 0">{{ .Token }}</p>
  <p style="color:#6B675F">Si no pediste este cambio, ignora este correo: tu contraseña no cambia.</p>
</div>
```

### Change Email Address
Asunto: `Confirma tu nuevo correo: {{ .Token }}` — mismo formato que "Confirm signup".

## 5. Celular (SMS) — desactivado

La app ya trae el flujo de código por SMS, oculto detrás de `VITE_AUTH_SMS_ENABLED=false`.

**Para activarlo con SMS:**
1. Crea una cuenta en **Twilio** (también sirven Vonage, MessageBird o Textlocal) y un número o servicio *Verify*.
2. En Supabase → **Authentication → Sign In / Providers → Phone**: activa, elige Twilio y pega Account SID, Auth Token y Message Service SID.
3. En `.env`: `VITE_AUTH_SMS_ENABLED=true`.
4. Costo aproximado: se paga por mensaje enviado (revisa la tarifa a Colombia en Twilio).

**Alternativa por WhatsApp con tu n8n:**
1. Supabase → **Authentication → Hooks → Send SMS Hook** → tipo HTTP, apuntando a un webhook de n8n (por ejemplo `https://TU-N8N/webhook/auth-sms`). Supabase genera un *secret*.
2. En n8n, el flujo recibe `{ user: { phone }, sms: { otp } }`, **verifica la firma** del encabezado `webhook-signature` con ese secret (formato Standard Webhooks) y envía el código por la API de WhatsApp que ya usabas.
3. Responde `200` con `{}`. El resto (verificar el código) lo sigue haciendo Supabase, así que la app no cambia: solo activa `VITE_AUTH_SMS_ENABLED=true`.

Mientras n8n esté apagado, deja el SMS desactivado.

## 6. n8n (opcional)

Las reservas ahora se guardan directamente en Supabase. Si vuelves a activar n8n:
- Con `VITE_N8N_ENABLED=true`, la app además envía al webhook el **mismo payload de siempre** (`tipo_evento: 'nueva_cita'`, etc.) para mandar el WhatsApp de confirmación.
- Si n8n escribe en `appointments` (recordatorios, `reminder_sent`), debe usar la **service_role key** dentro de n8n, nunca en la app.
- Los enlaces de cancelación deben ser `https://TU-DOMINIO/cancel?id=<cancel_token>` (el token, no el id de la cita).
