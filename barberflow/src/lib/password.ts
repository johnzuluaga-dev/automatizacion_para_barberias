import { config } from './config';

export interface PasswordStrength {
  /** 0 (muy débil) a 4 (muy fuerte). */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** Sugerencia concreta para mejorarla, si aplica. */
  hint?: string;
}

const LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'] as const;

const COMMON = ['123456', 'password', 'contraseña', 'qwerty', 'barberflow', 'abc123', '111111', 'admin'];

/**
 * Estimación local y liviana (sin librerías pesadas). La regla dura —mínimo de
 * caracteres— la valida también Firebase en el servidor.
 */
export function measurePassword(password: string): PasswordStrength {
  if (!password) return { score: 0, label: LABELS[0] };

  const lower = password.toLowerCase();
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  let points = 0;

  if (password.length >= config.passwordMinLength) points += 1;
  if (password.length >= 14) points += 1;
  if (password.length >= 18) points += 1;
  points += Math.max(0, variety - 1);

  const repeated = /(.)\1{2,}/.test(password);
  const common = COMMON.some((w) => lower.includes(w));
  const sequential = /(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|qwer)/i.test(password);
  if (repeated) points -= 1;
  if (common) points -= 2;
  if (sequential) points -= 1;
  if (password.length < config.passwordMinLength) points = Math.min(points, 1);

  const score = Math.max(0, Math.min(4, Math.round((points / 6) * 4))) as PasswordStrength['score'];

  let hint: string | undefined;
  if (password.length < config.passwordMinLength) hint = `Usa al menos ${config.passwordMinLength} caracteres.`;
  else if (common) hint = 'Evita palabras comunes o el nombre de la barbería.';
  else if (sequential || repeated) hint = 'Evita secuencias y caracteres repetidos.';
  else if (variety < 3) hint = 'Combina mayúsculas, números o símbolos.';
  else if (score < 3) hint = 'Una frase más larga la hace más segura.';

  return { score, label: LABELS[score], hint };
}
