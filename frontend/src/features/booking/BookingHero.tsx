import { m, type Variants } from 'motion/react';
import { CalendarCheck, CalendarX2, Clock3 } from 'lucide-react';
import { BarberPole } from '@/components/ui/BarberPole';

const facts = [
  { Icon: Clock3, text: 'Solo ves horas libres' },
  { Icon: CalendarCheck, text: 'Tus citas en un solo lugar' },
  { Icon: CalendarX2, text: 'Cancela desde tu cuenta' },
];

// Entrada en cascada: cada bloque sube y aparece un poco después del anterior.
// Con "reducir movimiento" MotionConfig (App.tsx) quita el desplazamiento.
const cascade: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export function BookingHero() {
  return (
    <header className="relative overflow-hidden rounded-xl border border-line bg-surface-2 px-5 py-8 sm:px-8 sm:py-10">
      <m.div className="relative z-10 pr-0 lg:pr-36" variants={cascade} initial="hidden" animate="shown">
        <m.div variants={rise} className="flex items-center gap-3">
          <span aria-hidden className="bf-pole h-2.5 w-12 rounded-full" />
          <p className="text-sm font-medium tracking-wide text-muted">Estilo &amp; Automatización</p>
        </m.div>
        <m.h1 variants={rise} className="mt-5 max-w-[14ch] text-display font-bold">
          Tu próximo corte, <span className="text-accent">en un minuto.</span>
        </m.h1>
        <m.p variants={rise} className="mt-5 max-w-xl text-lg text-muted">
          Elige servicio, barbero y hora. La barbería confirma tu cita y la ves en tu cuenta.
        </m.p>
        <m.ul variants={cascade} className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {facts.map(({ Icon, text }) => (
            <m.li key={text} variants={rise} className="inline-flex items-center gap-2 text-ink/80">
              <Icon aria-hidden className="size-4 text-detail" />
              {text}
            </m.li>
          ))}
        </m.ul>
      </m.div>
      {/* Poste de barbería a la derecha (solo escritorio): entra desde abajo al final de la cascada. */}
      <m.div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-8 hidden -translate-y-1/2 lg:block"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <BarberPole height={230} />
      </m.div>
    </header>
  );
}
