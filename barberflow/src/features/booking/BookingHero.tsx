import { CalendarCheck, CalendarX2, Clock3 } from 'lucide-react';

const facts = [
  { Icon: Clock3, text: 'Solo ves horas libres' },
  { Icon: CalendarCheck, text: 'Tus citas en un solo lugar' },
  { Icon: CalendarX2, text: 'Cancela desde tu cuenta' },
];

export function BookingHero() {
  return (
    <header className="pb-2">
      <div className="flex items-center gap-3">
        <span aria-hidden className="bf-pole h-2.5 w-12 rounded-full" />
        <p className="text-sm font-medium tracking-wide text-muted">Estilo &amp; Automatización</p>
      </div>
      <h1 className="mt-5 max-w-[14ch] text-display font-bold">
        Tu próximo corte, <span className="text-accent">en un minuto.</span>
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
        Elige servicio, barbero y hora. La barbería confirma tu cita y la ves en tu cuenta.
      </p>
      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {facts.map(({ Icon, text }) => (
          <li key={text} className="inline-flex items-center gap-2 text-ink/80">
            <Icon aria-hidden className="size-4 text-detail" />
            {text}
          </li>
        ))}
      </ul>
    </header>
  );
}
