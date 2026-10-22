import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Mail, Phone, User } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { signUp } from './auth-api';
import { messageFor } from './errors';
import { redirectTarget } from './redirect';
import { validateRegister, type RegisterErrors, type RegisterValues } from './validation';

const FIELD_ORDER: (keyof RegisterValues)[] = ['fullName', 'email', 'phone', 'password', 'terms'];

export function RegisterForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState<RegisterValues>({ fullName: '', email: '', phone: '', password: '', terms: false });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof RegisterValues>(field: K, value: RegisterValues[K]) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (attempted) setErrors(validateRegister(next));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttempted(true);
    setSubmitError(null);
    const found = validateRegister(values);
    setErrors(found);
    const first = FIELD_ORDER.find((k) => found[k]);
    if (first) {
      document.getElementById(`reg-${first}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const email = values.email.trim().toLowerCase();
      await signUp({ fullName: values.fullName.trim(), email, phone: values.phone.trim(), password: values.password });
      navigate('/verificar', { state: { from: redirectTarget(location.state), sent: true } });
    } catch (err) {
      setSubmitError(messageFor(err));
      setLoading(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-label="Crear cuenta" className="flex flex-col gap-5">
      {submitError && <Alert tone="danger">{submitError}</Alert>}

      <TextField
        id="reg-fullName"
        label="Nombre completo"
        placeholder="Ej. Juan Pérez"
        autoComplete="name"
        required
        icon={<User />}
        value={values.fullName}
        onChange={(e) => update('fullName', e.target.value)}
        error={errors.fullName}
      />
      <TextField
        id="reg-email"
        label="Correo"
        type="email"
        placeholder="tu@correo.com"
        autoComplete="email"
        inputMode="email"
        required
        icon={<Mail />}
        value={values.email}
        onChange={(e) => update('email', e.target.value)}
        error={errors.email}
      />
      <TextField
        id="reg-phone"
        label="Celular (opcional)"
        type="tel"
        placeholder="Ej. 300 123 4567"
        autoComplete="tel"
        inputMode="tel"
        icon={<Phone />}
        value={values.phone}
        onChange={(e) => update('phone', e.target.value)}
        error={errors.phone}
        hint="Lo usamos para avisarte de tu cita."
      />
      <PasswordField
        id="reg-password"
        label="Contraseña"
        placeholder="Mínimo 10 caracteres"
        autoComplete="new-password"
        required
        showStrength
        hint="Usa al menos 10 caracteres."
        value={values.password}
        onChange={(e) => update('password', e.target.value)}
        error={errors.password}
      />
      <Checkbox
        id="reg-terms"
        checked={values.terms}
        onChange={(e) => update('terms', e.target.checked)}
        error={errors.terms}
        label={
          <>
            Acepto los{' '}
            <Link to="/terminos" target="_blank" className="font-medium underline underline-offset-3 hover:text-accent">
              términos y la política de datos
            </Link>
            .
          </>
        }
      />

      <Button type="submit" size="lg" className="w-full" loading={loading} loadingText="Creando cuenta...">
        Crear cuenta
      </Button>
    </form>
  );
}
