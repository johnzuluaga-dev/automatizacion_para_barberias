import { Spinner } from '@/components/ui/Spinner';

/** Mientras carga el chunk de una ruta. */
export function PageFallback() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner label="Cargando" className="size-6 text-muted" />
    </div>
  );
}
