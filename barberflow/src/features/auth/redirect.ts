/** Ruta interna segura a la que volver tras ingresar (evita redirecciones abiertas). */
export function redirectTarget(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/';
}
