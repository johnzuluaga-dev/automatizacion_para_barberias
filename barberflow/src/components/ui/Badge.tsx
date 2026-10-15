import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

/** Texto con la variante AA; el punto lleva el color de marca del estado. */
const tones: Record<BadgeTone, { box: string; dot: string }> = {
  neutral: { box: 'bg-surface-2 text-muted', dot: 'bg-muted' },
  accent: { box: 'bg-accent-soft text-accent-soft-ink', dot: 'bg-accent' },
  success: { box: 'bg-success-soft text-success-text', dot: 'bg-success' },
  warning: { box: 'bg-warning-soft text-warning-text', dot: 'bg-warning' },
  danger: { box: 'bg-danger-soft text-danger-text', dot: 'bg-danger' },
  info: { box: 'bg-info-soft text-info-text', dot: 'bg-info' },
};

interface BadgeProps {
  tone?: BadgeTone;
  /** Muestra un punto de color antes del texto. */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', dot = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        tones[tone].box,
        className,
      )}
    >
      {dot && <span aria-hidden className={cn('size-1.5 rounded-full', tones[tone].dot)} />}
      {children}
    </span>
  );
}
