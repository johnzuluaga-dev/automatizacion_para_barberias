import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** Superficie base: radio mediano, borde fino y sombra sutil. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-lg border border-line bg-surface shadow-sm', className)} {...props} />;
}
