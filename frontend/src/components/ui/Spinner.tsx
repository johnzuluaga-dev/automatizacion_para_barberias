import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  /** Texto para lectores de pantalla; si se omite, el spinner es decorativo. */
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span role={label ? 'status' : undefined} className="inline-flex">
      <LoaderCircle aria-hidden className={cn('size-4 animate-spin', className)} />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
