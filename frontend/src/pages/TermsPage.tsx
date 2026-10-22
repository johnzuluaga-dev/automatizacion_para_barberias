import { PublicLayout } from '@/components/layout/PublicLayout';

export default function TermsPage() {
  return (
    <PublicLayout>
      <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold sm:text-4xl">Términos y política de datos</h1>
        <p className="mt-3 text-muted">Texto base del proyecto. Revísalo antes de publicar la app.</p>

        <div className="mt-10 flex flex-col gap-8 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold">Qué datos guardamos</h2>
            <p className="mt-2 text-ink/85">
              Tu nombre, correo, celular (si lo das) y las citas que agendas: servicio, barbero, día, hora y estado.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Para qué los usamos</h2>
            <p className="mt-2 text-ink/85">
              Para gestionar tus citas, verificar tu cuenta y avisarte sobre tu reserva. No vendemos ni compartimos tus datos con
              terceros para publicidad.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Quién puede verlos</h2>
            <p className="mt-2 text-ink/85">
              Tú ves solo tus citas. El equipo de la barbería ve la agenda completa para atenderte.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Tus derechos</h2>
            <p className="mt-2 text-ink/85">
              Puedes pedir que corrijamos o eliminemos tus datos escribiendo a la barbería. Puedes cancelar tus citas desde
              “Mis citas”.
            </p>
          </section>
        </div>
      </article>
    </PublicLayout>
  );
}
