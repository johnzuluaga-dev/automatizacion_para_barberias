import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface State {
  hasError: boolean;
}

/**
 * Captura errores de render (p. ej. un chunk que no carga tras un despliegue)
 * y ofrece recargar en vez de dejar la pantalla en blanco.
 */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de interfaz:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="grid min-h-dvh place-items-center px-4">
        <div className="max-w-sm text-center">
          <p className="font-display text-2xl font-bold">Algo salió mal</p>
          <p className="mt-2 text-muted">No pudimos cargar esta pantalla. Recarga la página para intentarlo de nuevo.</p>
          <Button className="mt-6" icon={<RotateCw aria-hidden className="size-4" />} onClick={() => window.location.reload()}>
            Recargar
          </Button>
        </div>
      </div>
    );
  }
}
