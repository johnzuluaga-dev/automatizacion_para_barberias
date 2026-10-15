import { config } from '@/lib/config';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Escribe tu correo.';
  if (!EMAIL.test(email.trim())) return 'Revisa el correo: debe verse como nombre@correo.com.';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Escribe una contraseña.';
  if (password.length < config.passwordMinLength) {
    return `La contraseña debe tener al menos ${config.passwordMinLength} caracteres.`;
  }
  return undefined;
}

export function validatePhone(phone: string, required = false): string | undefined {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return required ? 'Escribe tu celular.' : undefined;
  if (!/^\+?[\d\s()-]+$/.test(phone.trim()) || digits.length < 7 || digits.length > 15) {
    return 'Revisa el número: solo dígitos, entre 7 y 15.';
  }
  return undefined;
}

export interface RegisterValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  terms: boolean;
}

export type RegisterErrors = Partial<Record<keyof RegisterValues, string>>;

export function validateRegister(v: RegisterValues): RegisterErrors {
  const errors: RegisterErrors = {};
  if (v.fullName.trim().length < 3) errors.fullName = 'Escribe tu nombre completo.';
  const email = validateEmail(v.email);
  if (email) errors.email = email;
  const phone = validatePhone(v.phone);
  if (phone) errors.phone = phone;
  const password = validatePassword(v.password);
  if (password) errors.password = password;
  if (!v.terms) errors.terms = 'Debes aceptar los términos para crear tu cuenta.';
  return errors;
}

/** Normaliza un celular colombiano a formato E.164 (+57…) para SMS. */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+')) return `+${digits}`;
  return digits.length === 10 ? `+57${digits}` : `+${digits}`;
}
