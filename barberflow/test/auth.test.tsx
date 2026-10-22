import { beforeEach, describe, expect, test, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthFlowError } from '../src/features/auth/errors';
import * as api from './mocks/auth-api';
import { renderAt } from './mocks/render';

vi.mock('../src/features/auth/auth-api', () => import('./mocks/auth-api'));
vi.mock('../src/lib/citas', () => ({
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
    api.signUp.mockImplementationOnce(async () => {
      api.setTestSession({ email: 'laura@correo.com', emailVerified: false });
    });
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

  test('un correo repetido muestra el mensaje de la cuenta existente', async () => {
    api.signUp.mockRejectedValueOnce(new AuthFlowError('email_in_use', 'Ese correo ya tiene una cuenta.'));
    const user = userEvent.setup();
    renderAt('/registro');
    await user.type(await screen.findByLabelText(/^nombre completo/i), 'Laura Gómez');
    await user.type(screen.getByLabelText(/^correo/i), 'laura@correo.com');
    await user.type(screen.getByLabelText(/^contraseña/i), 'Tijeras-Azules-2026');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ese correo ya tiene una cuenta.');
  });
});

describe('verificación del correo', () => {
  test('con el correo sin verificar muestra el aviso y permite revisar', async () => {
    api.setTestSession({ email: 'laura@correo.com', emailVerified: false });
    const user = userEvent.setup();
    renderAt('/verificar');
    expect(await screen.findByRole('heading', { name: 'Verifica tu correo' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ya verifiqué mi correo' }));
    expect(api.reloadUser).toHaveBeenCalled();
    expect(await screen.findByText(/todavía no vemos tu verificación/i)).toBeInTheDocument();
  });

  test('reenviar el enlace espera 60 s tras el envío inicial', async () => {
    api.setTestSession({ email: 'laura@correo.com', emailVerified: false });
    renderAt('/verificar', { sent: true });
    expect(await screen.findByText(/reenviar en 1:00|reenviar en 0:5\d/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reenviar enlace/i })).not.toBeInTheDocument();
  });

  test('si no se acaba de enviar, reenvía el enlace', async () => {
    api.setTestSession({ email: 'laura@correo.com', emailVerified: false });
    const user = userEvent.setup();
    renderAt('/verificar');
    await user.click(await screen.findByRole('button', { name: /reenviar enlace/i }));
    expect(api.resendVerification).toHaveBeenCalled();
    expect(await screen.findByText('Te enviamos un enlace nuevo')).toBeInTheDocument();
  });

  test('con el correo ya verificado vuelve a donde iba', async () => {
    api.setTestSession({ email: 'laura@correo.com', emailVerified: true });
    renderAt('/verificar', { from: '/mis-citas' });
    expect(await screen.findByRole('heading', { name: 'Mis citas' })).toBeInTheDocument();
  });

  test('sin sesión ofrece ingresar', async () => {
    renderAt('/verificar');
    expect(await screen.findByRole('heading', { name: 'Ingresa para verificar tu correo' })).toBeInTheDocument();
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
});

describe('rutas protegidas', () => {
  test('/mis-citas sin sesión lleva a ingresar', async () => {
    renderAt('/mis-citas');
    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument();
  });

  test('/admin con rol cliente muestra "sin acceso"', async () => {
    api.setTestSession({ role: 'cliente' });
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
