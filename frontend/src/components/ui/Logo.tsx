import { cn } from '@/lib/utils';

/** Marca: monograma "b" con aspa de tijera + logotipo en minúsculas. */
export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg aria-hidden viewBox="0 0 32 32" className="size-8 shrink-0">
        <rect width="32" height="32" rx="9" className="fill-accent" />
        <path
          d="M11 7v18M11 16.5c0-3 2-5 5-5s5 2 5 5-2 5-5 5-5-2-5-5Z"
          fill="none"
          className="stroke-accent-ink"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {withWordmark && (
        <span className="font-display text-xl leading-none font-bold tracking-tight">
          barber<span className="text-accent">flow</span>
        </span>
      )}
    </span>
  );
}
