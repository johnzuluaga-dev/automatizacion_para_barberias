import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { measurePassword } from '@/lib/password';
import { cn } from '@/lib/utils';
import { TextField } from './TextField';

interface PasswordFieldProps extends Omit<ComponentProps<typeof TextField>, 'type' | 'trailing' | 'icon'> {
  /** Muestra el indicador de fortaleza (registro y nueva contraseña). */
  showStrength?: boolean;
}

const barColor = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-success'];

export function PasswordField({ showStrength = false, value, hint, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const text = typeof value === 'string' ? value : '';
  const strength = measurePassword(text);

  return (
    <div className="flex flex-col gap-2">
      <TextField
        {...props}
        value={value}
        hint={showStrength ? undefined : hint}
        type={visible ? 'text' : 'password'}
        icon={<Lock />}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            className="grid size-9 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {visible ? <EyeOff aria-hidden className="size-4.5" /> : <Eye aria-hidden className="size-4.5" />}
          </button>
        }
      />
      {showStrength && (
        <div className="flex flex-col gap-1.5">
          <div aria-hidden className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={cn(
                  'h-1 rounded-full transition-colors duration-200',
                  text && strength.score >= step ? barColor[strength.score] : 'bg-line',
                )}
              />
            ))}
          </div>
          <p className="flex justify-between gap-3 text-xs text-muted" aria-live="polite">
            <span>{text ? strength.hint ?? hint ?? 'Buena contraseña.' : hint}</span>
            {text && <span className="shrink-0 font-medium text-ink">{strength.label}</span>}
          </p>
        </div>
      )}
    </div>
  );
}
