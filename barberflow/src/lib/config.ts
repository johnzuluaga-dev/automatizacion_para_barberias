/** Banderas de configuración leídas de las variables de entorno. */
export const config = {
  n8nEnabled: import.meta.env.VITE_N8N_ENABLED === 'true' && Boolean(import.meta.env.VITE_N8N_WEBHOOK_URL),
  /** Mínimo de caracteres de contraseña. */
  passwordMinLength: 10,
  resendSeconds: 60,
} as const;
