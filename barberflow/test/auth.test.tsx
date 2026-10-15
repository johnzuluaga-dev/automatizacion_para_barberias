import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthFlowError } from '../src/features/auth/errors';
import { savePending } from '../src/features/auth/pending';
import * as api from './mocks/auth-api';
import { renderAt } from './mocks/render';

vi.mock('../src/features/auth/auth-api', () => import('./mocks/auth-api'));
vi.mock('../src/lib/supabase', () => ({
  getAppointments: vi.fn().mockResolvedValue([]),
  getMyAppointments: vi.fn().mockResolvedValue([]),
  updateAppointmentStatus: vi.fn(),
  getTakenSlots: vi.fn().mockResolvedValue([]),
  createAppointment: vi.fn(),
  cancelMyAppointment: vi.fn(),
  cancelByToken: vi.fn(),
}));

beforeEach(() => {
  api.resetAuthMock();
});

function pasteCode(code: string) {
  const first = screen.getAllByRole('textbox', { name: /dígito/i })[0] as HTMLElement;
  fireEvent.paste(first, { clipboardData: { getData: () => code } });
}

describe('registro', () => {
  test('valida los campos y no envía si faltan datos', async () => {
    const user = userEvent.setup();
    renderAt('/registro');
    await user.click(await screen.findByRole('button', { name: 'Crear cuenta' }));
    expect(screen.getByText('Escribe tu nombre completo.')).toBeInTheDocument();
    expect(screen.getByText('Escribe tu correo.')).toBeInTheDocument();
    expect(screen.getByText('Escribe una contraseña.')).toBeInTheDocument();
    expect(screen.getByText('Debes aceptar los términos para crear tu cuenta.')).toBeInTheDocument();
    expect(api.signUp).not.toHaveBeenCalled();
  });

  test('exige contraseña de 10 caracteres', async () => {
    const user = userEvent.setup();
    renderAt('/registro');
    await user.type(await screen.findByLabelText(/^contraseña/i), 'corta123');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(screen.getByText('La contraseña debe tener al menos 10 caracteres.')).toBeInTheDocument();
  });

  test('crea la cuenta y pasa a verificar el correo', async () => {
    const user = userEvent.setup();
    renderAt('/registro');
    await user.type(await screen.findByLabelText(/^nombre completo/i), 'Laura Gómez');
    await user.type(screen.getByLabelText(/^correo/i), 'Laura@Correo.com');
    await user.type(screen.getByLabelText(/^celular/i), '300 111 2233');
    await user.type(screen.getByLabelText(/^contraseña/i), 'Tijeras-Azules-2026');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(api.signUp).toHaveBeenCalledWith({
      fullName: 'Laura Gómez',
      email: 'laura@correo.com',
      phone: '300 111 2233',
      password: 'Tijeras-Azules-2026',
    });
    expect(await screen.findByRole('heading', { name: 'Verifica tu correo' })).toBeInTheDocument();
    expect(screen.getByText('l***@correo.com')).toBeInTheDocument();
  });
});

describe('verificación', () => {
  test('6 casillas con one-time-code; pegar el código verifica la cuenta', async () => {
    savePending({ purpose: 'signup', target: 'laura@correo.com', sentAt: Date.now() });
    renderAt('/verificar');
    await screen.findByRole('heading', { name: 'Verifica tu correo' });
    const boxes = screen.getAllByRole('textbox', { name: /dígito/i });
    expect(boxes).toHaveLength(6);
    expect(boxes[0]).toHaveAttribute('autocomplete', 'one-time-code');

    pasteCode('482913');
    expect(api.verifyEmailCode).toHaveBeenCalledWith('laura@correo.com', '482913');
    expect(await screen.findByText('Tu cuenta quedó verificada')).toBeInTheDocument();
  });

  test('código vencido o incorrecto: mensaje claro y casillas vacías', async () => {
    api.verifyEmailCode.mockRejectedValueOnce(
      new AuthFlowError('otp_expired', 'El código venció o no es correcto. Revisa los 6 dígitos o pide uno nuevo.'),
    );
    savePending({ purpose: 'signup', target: 'laura@correo.com', sentAt: Date.now() });
    renderAt('/verificar');
    await screen.findByRole('heading', { name: 'Verifica tu correo' });
    pasteCode('000000');
    expect(await screen.findByText(/el código venció o no es correcto/i)).toBeInTheDocument();
    expect(screen.getAllByRole('textbox', { name: /dígito/i })[0]).toHaveValue('');
  });

  test('reenviar espera 60 s y luego reenvía', async () => {
    savePending({ purpose: 'signup', target: 'laura@correo.com', sentAt: Date.now() });
    const view = renderAt('/verificar');
    expect(await screen.findByText(/reenviar en 1:00|reenviar en 0:5\d/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reenviar código/i })).not.toBeInTheDocument();
    view.unmount();

    savePending({ purpose: 'signup', target: 'laura@correo.com', sentAt: Date.now() - 61_000 });
    const user = userEvent.setup();
    renderAt('/verificar');
    await user.click(await screen.findByRole('button', { name: /reenviar código/i }));
    expect(api.resendSignupCode).toHaveBeenCalledWith('laura@correo.com');
    expect(await screen.findByText('Te enviamos un código nuevo')).toBeInTheDocument();
  });

  test('sin verificación pendiente ofrece volver a ingresar', async () => {
    renderAt('/verificar');
    expect(await screen.findByRole('heading', { name: 'No hay un código pendiente' })).toBeInTheDocument();
  });
});

describe('inicio de sesión', () => {
  test('con correo y contraseña vuelve a la página de origen', async () => {
    api.signInWithPassword.mockImplementationOnce(async () => {
      api.setTestSession({ email: 'laura@correo.com' });
    });
    const user = userEvent.setup();
    renderAt('/ingresar', { from: '/mis-citas' });
    await user.type(await screen.findByLabelText(/^correo/i), 'laura@correo.com');
    await user.type(screen.getByLabelText(/^contraseña/i), 'Tijeras-Azules-2026');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(api.signInWithPassword).toHaveBeenCalledWith('laura@correo.com', 'Tijeras-Azules-2026');
    expect(await screen.findByRole('heading', { name: 'Mis citas' })).toBeInTheDocument();
  });

  test('credenciales incorrectas muestran un mensaje sin detalles', async () => {
    api.signInWithPassword.mockRejectedValueOnce(new AuthFlowError('invalid_credentials', 'Correo o contraseña incorrectos.'));
    const user = userEvent.setup();
    renderAt('/ingresar');
    await user.type(await screen.findByLabelText(/^correo/i), 'laura@correo.com');
    await user.type(screen.getByLabelText(/^contraseña/i), 'otra-clave-123');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
  });

  test('cuenta sin verificar: reenvía el código y pide verificar', async () => {
    api.signInWithPassword.mockRejectedValueOnce(new AuthFlowError('email_not_confirmed', 'x'));
    const user = userEvent.setup();
    renderAt('/ingresar');
    await user.type(await screen.findByLabelText(/^correo/i), 'laura@correo.com');
    await user.type(screen.getByLabelText(/^contraseña/i), 'Tijeras-Azules-2026');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('heading', { name: 'Verifica tu correo' })).toBeInTheDocument();
    expect(api.resendSignupCode).toHaveBeenCalledWith('laura@correo.com');
  });

  test('entrar con código envía el código y abre la verificación', async () => {
    const user = userEvent.setup();
    renderAt('/ingresar');
    await user.click(await screen.findByRole('button', { name: 'Con código' }));
    await user.type(screen.getByLabelText(/^correo/i), 'laura@correo.com');
    await user.click(screen.getByRole('button', { name: 'Enviarme un código' }));
    expect(api.sendLoginCode).toHaveBeenCalledWith('laura@correo.com');
    expect(await screen.findByRole('heading', { name: 'Escribe tu código' })).toBeInTheDocument();
  });
});

describe('recuperación de contraseña', () => {
  test('muestra el mismo mensaje genérico exista o no el correo', async () => {
    const user = userEvent.setup();
    renderAt('/olvide-contrasena');
    await user.type(await screen.findByLabelText(/^correo de tu cuenta/i), 'nadie@correo.com');
    await user.click(screen.getByRole('button', { name: 'Enviar instrucciones' }));
    expect(api.requestPasswordReset).toHaveBeenCalledWith('nadie@correo.com');
    expect(await screen.findByText(/si el correo está registrado/i)).toBeInTheDocument();
  });

  test('el código de recuperación lleva a crear la contraseña nueva', async () => {
    api.verifyRecoveryCode.mockImplementationOnce(async () => {
      api.setTestSession({ email: 'laura@correo.com' });
    });
    savePending({ purpose: 'recovery', target: 'laura@correo.com', sentAt: Date.now() });
    renderAt('/verificar');
    await screen.findByRole('heading', { name: 'Código de recuperación' });
    pasteCode('123456');
    expect(api.verifyRecoveryCode).toHaveBeenCalledWith('laura@correo.com', '123456');
    expect(await screen.findByRole('heading', { name: 'Crea una contraseña nueva' })).toBeInTheDocument();
  });

  test('/nueva-contrasena sin sesión explica que el enlace venció', async () => {
    renderAt('/nueva-contrasena');
    expect(await screen.findByRole('heading', { name: 'El enlace venció' })).toBeInTheDocument();
  });

  test('valida coincidencia y guarda la contraseña nueva', async () => {
    api.setTestSession({ email: 'laura@correo.com' });
    const user = userEvent.setup();
    renderAt('/nueva-contrasena');
    await user.type(await screen.findByLabelText(/^nueva contraseña/i, { selector: 'input' }), 'Navaja-Nueva-2026');
    await user.type(screen.getByLabelText(/^repite la contraseña/i), 'Navaja-Nueva-2025');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(api.updatePassword).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/^repite la contraseña/i));
    await user.type(screen.getByLabelText(/^repite la contraseña/i), 'Navaja-Nueva-2026');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(api.updatePassword).toHaveBeenCalledWith('Navaja-Nueva-2026');
    expect(await screen.findByText('Contraseña actualizada')).toBeInTheDocument();
  });
});

describe('rutas protegidas', () => {
  test('/mis-citas sin sesión lleva a ingresar', async () => {
    renderAt('/mis-citas');
    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument();
  });

  test('/admin con rol cliente muestra "sin acceso"', async () => {
    api.setTestSession({ role: 'client' });
    renderAt('/admin');
    expect(await screen.findByRole('heading', { name: 'No tienes acceso a esta sección' })).toBeInTheDocument();
  });

  test('/admin con rol admin abre el panel y permite salir', async () => {
    api.setTestSession({ role: 'admin', name: 'Carlos Ruiz' });
    const user = userEvent.setup();
    renderAt('/admin');
    const heading = await screen.findByRole('heading', { name: 'Gestión de Citas' });
    expect(heading).toBeInTheDocument();
    const sidebar = screen.getByRole('navigation', { name: 'Secciones del panel' }).closest('aside') as HTMLElement;
    await user.click(within(sidebar).getByRole('button', { name: 'Salir' }));
    expect(api.signOut).toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument();
  });
});
