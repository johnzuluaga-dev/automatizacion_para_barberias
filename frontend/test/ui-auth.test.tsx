import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordField } from '../src/components/ui/PasswordField';
import { measurePassword } from '../src/lib/password';

describe('contraseña', () => {
  test('mide la fortaleza y exige 10 caracteres', () => {
    expect(measurePassword('corta1!').hint).toMatch(/10 caracteres/);
    expect(measurePassword('barberflow2026!').hint).toMatch(/comunes/);
    expect(measurePassword('Tijeras-Azules-del-Martes').score).toBeGreaterThanOrEqual(3);
  });

  test('muestra el indicador y permite ver la contraseña', async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Contraseña" value="abc" onChange={() => {}} showStrength />);
    expect(screen.getByText('Usa al menos 10 caracteres.')).toBeInTheDocument();
    const input = screen.getByLabelText(/^contraseña/i);
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');
  });
});
