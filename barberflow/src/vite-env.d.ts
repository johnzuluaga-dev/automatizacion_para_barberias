/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  /** Clave pública (publishable/anon). Nunca la service_role. */
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_N8N_WEBHOOK_URL?: string;
  /** "true" para avisar a n8n de cada reserva nueva (desactivado por defecto). */
  readonly VITE_N8N_ENABLED?: string;
  /** "true" para mostrar el acceso con código por SMS (requiere proveedor en Supabase). */
  readonly VITE_AUTH_SMS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
