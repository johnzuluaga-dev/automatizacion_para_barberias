/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_N8N_WEBHOOK_URL?: string;
  /** "true" para avisar a n8n de cada reserva nueva (desactivado por defecto). */
  readonly VITE_N8N_ENABLED?: string;
  /** Webhook de n8n que cancela una cita por su cancelToken (enlace sin sesión). */
  readonly VITE_N8N_CANCEL_WEBHOOK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
