/**
 * Verificación pendiente entre pantallas (registro → /verificar, etc.).
 * Solo guarda el destino y el motivo; nunca códigos ni contraseñas.
 */
export type VerifyPurpose = 'signup' | 'login' | 'recovery' | 'sms';

export interface PendingVerification {
  purpose: VerifyPurpose;
  /** Correo o celular al que se envió el código. */
  target: string;
  /** Momento del último envío (ms), para la cuenta regresiva de reenvío. */
  sentAt: number;
}

const KEY = 'barberflow_pending_verification';

export function savePending(pending: PendingVerification): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(pending));
  } catch {
    // Sin almacenamiento: la pantalla de verificación pedirá el correo de nuevo.
  }
}

export function readPending(): PendingVerification | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingVerification>;
    if (!parsed.purpose || !parsed.target || typeof parsed.sentAt !== 'number') return null;
    return parsed as PendingVerification;
  } catch {
    return null;
  }
}

export function clearPending(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nada que limpiar
  }
}

/** Oculta parte del correo o celular al mostrarlo (j***@gmail.com, ***4567). */
export function maskTarget(target: string): string {
  if (target.includes('@')) {
    const [user = '', domain = ''] = target.split('@');
    return `${user.slice(0, 1)}***@${domain}`;
  }
  return `***${target.slice(-4)}`;
}
