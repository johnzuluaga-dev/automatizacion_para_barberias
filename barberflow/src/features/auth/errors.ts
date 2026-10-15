import { isAuthError } from '@supabase/supabase-js';

/** Error de cuenta con un mensaje listo para mostrar (nunca el mensaje crudo del servidor). */
export class AuthFlowError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthFlowError';
    this.code = code;
  }
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Tu correo aún no está verificado. Te enviamos un código nuevo.',
  otp_expired: 'El código venció o no es correcto. Revisa los 6 dígitos o pide uno nuevo.',
  weak_password: 'La contraseña es muy débil. Usa al menos 10 caracteres y combina letras, números o símbolos.',
  same_password: 'La nueva contraseña debe ser distinta a la anterior.',
  over_email_send_rate_limit: 'Enviamos demasiados correos seguidos. Espera unos minutos e inténtalo de nuevo.',
  over_sms_send_rate_limit: 'Enviamos demasiados mensajes seguidos. Espera unos minutos e inténtalo de nuevo.',
  over_request_rate_limit: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  email_address_invalid: 'Revisa el correo: no parece válido.',
  validation_failed: 'Revisa los datos e inténtalo de nuevo.',
  signup_disabled: 'El registro está cerrado por ahora.',
  session_expired: 'Tu sesión venció. Ingresa de nuevo.',
  session_not_found: 'Tu sesión venció. Ingresa de nuevo.',
  phone_provider_disabled: 'El acceso por celular no está disponible.',
  sms_send_failed: 'No pudimos enviar el SMS. Inténtalo de nuevo o usa tu correo.',
  network: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
};

const FALLBACK = 'No pudimos completar la acción. Inténtalo de nuevo.';

/** Convierte cualquier error de Supabase en un AuthFlowError con mensaje en español. */
export function toAuthFlowError(error: unknown): AuthFlowError {
  if (error instanceof AuthFlowError) return error;
  if (isAuthError(error)) {
    if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
      return new AuthFlowError('network', MESSAGES.network ?? FALLBACK);
    }
    const code = error.code ?? (error.status === 429 ? 'over_request_rate_limit' : 'unknown');
    return new AuthFlowError(code, MESSAGES[code] ?? FALLBACK);
  }
  if (error instanceof TypeError) return new AuthFlowError('network', MESSAGES.network ?? FALLBACK);
  return new AuthFlowError('unknown', FALLBACK);
}

export function messageFor(error: unknown): string {
  return toAuthFlowError(error).message;
}
