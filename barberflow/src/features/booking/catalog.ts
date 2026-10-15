export interface Service {
  name: string;
  price: number;
}

export const SERVICIOS: readonly Service[] = [
  { name: 'Corte Clásico', price: 15 },
  { name: 'Corte + Barba', price: 25 },
  { name: 'Perfilado de Barba', price: 10 },
  { name: 'Tratamiento Facial', price: 30 },
];

export const BARBEROS: readonly string[] = ['Carlos The Blade', 'Andrés Estilo', 'Juan Classic'];

export function findService(name: string): Service | undefined {
  return SERVICIOS.find((s) => s.name === name);
}

export function formatPrice(price: number): string {
  return `$${price}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-ZÁÉÍÓÚÑ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}
