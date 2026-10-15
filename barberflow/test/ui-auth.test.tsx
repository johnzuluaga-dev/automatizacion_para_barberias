import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OtpInput } from '../src/components/ui/OtpInput';
import { PasswordField } from '../src/components/ui/PasswordField';
import { measurePassword } from '../src/lib/password';

function Otp({ onComplete }: { onComplete: (v: string) => void }) {
  const [code, setCode] = useState('');
  return <OtpInput value={code} onChange={setCode} onComplete={onComplete} />;
}

describe('OtpInput', () => {
  test('tiene 6 casillas y autocomplete="one-time-code" en la primera', () => {
    render(<Otp onComplete={() => {}} />);
    const boxes = screen.getAllByRole('textbox');
    expect(boxes).toHaveLength(6);
    expect(boxes[0]).toHaveAttribute('autocomplete', 'one-time-code');
    expect(boxes[0]).toHaveAttribute('inputmode', 'numeric');
  });

  test('avanza solo al escribir y completa', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<Otp onComplete={onComplete} />);
    const boxes = screen.getAllByRole('textbox');
    await user.click(boxes[0] as HTMLElement);
    await user.keyboard('482913');
    expect(onComplete).toHaveBeenCalledWith('482913');
    expect(boxes[5]).toHaveValue('3');
  });

  test('acepta pegar el código completo e ignora lo que no son dígitos', () => {
    const onComplete = vi.fn();
    render(<Otp onComplete={onComplete} />);
    const first = screen.getAllByRole('textbox')[0] as HTMLElement;
    fireEvent.paste(first, { clipboardData: { getData: () => ' 48-29 13 ' } });
    expect(onComplete).toHaveBeenCalledWith('482913');
  });

  test('Backspace borra y retrocede', async () => {
    const user = userEvent.setup();
    render(<Otp onComplete={() => {}} />);
    const boxes = screen.getAllByRole('textbox');
    await user.click(boxes[0] as HTMLElement);
    await user.keyboard('48');
    await user.keyboard('{Backspace}{Backspace}');
    expect(boxes[0]).toHaveValue('');
    expect(boxes[1]).toHaveValue('');
  });
});

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
