import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/components/ui/Button';
import { TextField } from '../src/components/ui/TextField';
import { ToastProvider } from '../src/components/ui/toast/ToastProvider';
import { useToast } from '../src/components/ui/toast/toast-context';

describe('primitivas de UI', () => {
  test('Button en carga queda deshabilitado y muestra el texto de carga', () => {
    render(
      <Button loading loadingText="Enviando...">
        Enviar
      </Button>,
    );
    const btn = screen.getByRole('button', { name: /enviando/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  test('TextField asocia label y mensaje de error', () => {
    render(<TextField label="Teléfono" error="Ingresa un teléfono válido" />);
    const input = screen.getByLabelText('Teléfono');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Ingresa un teléfono válido');
  });

  test('useToast muestra una notificación accesible', async () => {
    function Trigger() {
      const toast = useToast();
      return <button onClick={() => toast({ tone: 'success', title: 'Guardado' })}>Lanzar</button>;
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Lanzar' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Guardado');
  });
});
