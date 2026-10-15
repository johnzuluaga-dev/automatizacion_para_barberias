/** Banderas de configuración leídas de las variables de entorno. */
export const config = {
  smsEnabled: import.meta.env.VITE_AUTH_SMS_ENABLED === 'true',
  n8nEnabled: import.meta.env.VITE_N8N_ENABLED === 'true' && Boolean(import.meta.env.VITE_N8N_WEBHOOK_URL),
  /** Longitud del código que envía Supabase (Auth → Email OTP length). */
  otpLength: 6,
  /** Mínimo de caracteres de contraseña (también configurado en Supabase). */
  passwordMinLength: 10,
  resendSeconds: 60,
} as const;
