import { BarberPole } from '@/components/ui/BarberPole';
import { cn } from '@/lib/utils';

/** Marca: poste de barbería (rojo, blanco y azul) + logotipo en minúsculas. */
export function Logo({
  className,
  withWordmark = true,
  animated = true,
}: {
  className?: string;
  withWordmark?: boolean;
  animated?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BarberPole height={36} animated={animated} />
      {withWordmark && (
        <span className="font-display text-xl leading-none font-bold tracking-tight">
          barber<span className="text-accent">flow</span>
        </span>
      )}
    </span>
  );
}
