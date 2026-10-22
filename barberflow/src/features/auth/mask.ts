/** Oculta parte del correo al mostrarlo (j***@gmail.com). */
export function maskEmail(email: string): string {
  const [user = '', domain = ''] = email.split('@');
  return `${user.slice(0, 1)}***@${domain}`;
}
