import { useId } from 'react';
import { cn } from '@/lib/utils';

interface BarberPoleProps {
  /** Alto en píxeles; el ancho se calcula con la proporción del poste. */
  height?: number;
  /** Las franjas giran de forma continua (se detienen con "reducir movimiento"). */
  animated?: boolean;
  className?: string;
}

// Proporción del dibujo: 40 de ancho por 130 de alto.
const VIEW_W = 40;
const VIEW_H = 130;
// Cuatro franjas (rojo, blanco, azul, blanco) de 12 unidades forman un periodo de 48;
// la animación desplaza exactamente ese periodo (ver .bf-pole-spin en index.css).
const BAND = 12;
const SLOPE = 20;
const COLORS = ['#d6213a', '#ffffff', '#1d4ed8', '#ffffff'];

/**
 * Poste de barbería: cilindro de vidrio con franjas rojas, blancas y azules que
 * giran, y tapas metálicas arriba y abajo. Es decorativo (aria-hidden).
 */
export function BarberPole({ height = 120, animated = true, className }: BarberPoleProps) {
  const uid = useId().replace(/:/g, '');
  const clipId = `pole-clip-${uid}`;
  const glassId = `pole-glass-${uid}`;
  const metalId = `pole-metal-${uid}`;

  const bands = [];
  for (let i = -5; i <= 16; i++) {
    const y = i * BAND;
    const color = COLORS[(((i % 4) + 4) % 4)];
    bands.push(
      <polygon
        key={i}
        fill={color}
        points={`0,${y} ${VIEW_W},${y - SLOPE} ${VIEW_W},${y - SLOPE + BAND} 0,${y + BAND}`}
      />,
    );
  }

  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={(height * VIEW_W) / VIEW_H}
      height={height}
      className={cn('bf-barber-pole shrink-0 overflow-visible', className)}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="7" y="16" width="26" height="98" rx="3" />
        </clipPath>
        {/* Brillo de vidrio: luz a la izquierda y sombra a la derecha */}
        <linearGradient id={glassId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#0f172a" stopOpacity="0.22" />
          <stop offset="0.22" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.78" stopColor="#0f172a" stopOpacity="0.04" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0.28" />
        </linearGradient>
        {/* Metal cromado de las tapas */}
        <linearGradient id={metalId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8d99ad" />
          <stop offset="0.3" stopColor="#f4f7fb" />
          <stop offset="0.55" stopColor="#c3ccda" />
          <stop offset="1" stopColor="#7c889d" />
        </linearGradient>
      </defs>

      {/* Sombra de apoyo */}
      <ellipse cx="20" cy="126" rx="13" ry="2.4" fill="#0f172a" opacity="0.12" />

      {/* Franjas dentro del cilindro */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="7" y="16" width="26" height="98" fill="#ffffff" />
        <g className={animated ? 'bf-pole-spin' : undefined}>{bands}</g>
      </g>
      <rect x="7" y="16" width="26" height="98" rx="3" fill={`url(#${glassId})`} />
      <rect x="7" y="16" width="26" height="98" rx="3" fill="none" stroke="#0f172a" strokeOpacity="0.18" />

      {/* Tapa superior con remate */}
      <circle cx="20" cy="5.5" r="4.5" fill={`url(#${metalId})`} />
      <rect x="4" y="9" width="32" height="9" rx="3" fill={`url(#${metalId})`} />
      {/* Tapa inferior */}
      <rect x="4" y="112" width="32" height="9" rx="3" fill={`url(#${metalId})`} />
      <rect x="9" y="121" width="22" height="3" rx="1.5" fill={`url(#${metalId})`} />
    </svg>
  );
}
