import { FirebaseError } from 'firebase/app';

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
  email_in_use: 'Ese correo ya tiene una cuenta. Ingresa con tu contraseña o recupérala.',
  weak_password: 'La contraseña es muy débil. Usa al menos 10 caracteres y combina letras, números o símbolos.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  email_address_invalid: 'Revisa el correo: no parece válido.',
  user_disabled: 'Esta cuenta está deshabilitada. Escríbele a la barbería.',
  session_expired: 'Tu sesión venció. Ingresa de nuevo.',
  network: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
};

const FIREBASE_CODES: Record<string, string> = {
  'auth/invalid-credential': 'invalid_credentials',
  'auth/invalid-login-credentials': 'invalid_credentials',
  'auth/wrong-password': 'invalid_credentials',
  'auth/user-not-found': 'invalid_credentials',
  'auth/email-already-in-use': 'email_in_use',
  'auth/weak-password': 'weak_password',
  'auth/too-many-requests': 'over_request_rate_limit',
  'auth/invalid-email': 'email_address_invalid',
  'auth/user-disabled': 'user_disabled',
  'auth/requires-recent-login': 'session_expired',
  'auth/user-token-expired': 'session_expired',
  'auth/network-request-failed': 'network',
};

const FALLBACK = 'No pudimos completar la acción. Inténtalo de nuevo.';

/** Convierte cualquier error de Firebase en un AuthFlowError con mensaje en español. */
export function toAuthFlowError(error: unknown): AuthFlowError {
  if (error instanceof AuthFlowError) return error;
  if (error instanceof FirebaseError) {
    const code = FIREBASE_CODES[error.code] ?? 'unknown';
    return new AuthFlowError(code, MESSAGES[code] ?? FALLBACK);
  }
  if (error instanceof TypeError) return new AuthFlowError('network', MESSAGES.network ?? FALLBACK);
  return new AuthFlowError('unknown', FALLBACK);
}

export function messageFor(error: unknown): string {
  return toAuthFlowError(error).message;
}
