import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  /** Elemento al final del input (p. ej. botón de mostrar contraseña). */
  trailing?: ReactNode;
}

export const inputStyles =
  'h-12 w-full rounded-md border border-line-strong bg-surface px-3.5 text-base text-ink ' +
  'placeholder:text-muted transition-[border-color,box-shadow] duration-150 ease-out ' +
  'hover:border-ink/40 focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/20 ' +
  'aria-invalid:border-danger aria-invalid:focus:ring-danger/20';

export function TextField({ id: idProp, label, hint, error, icon, trailing, className, required, ...props }: TextFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span aria-hidden className="text-accent">
            {' '}*
          </span>
        )}
      </label>
      <div className="relative">
        {icon && (
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted [&_svg]:size-4.5">
            {icon}
          </span>
        )}
        <input
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputStyles, icon && 'pl-10', trailing && 'pr-12')}
          {...props}
        />
        {trailing && <span className="absolute top-1/2 right-1.5 -translate-y-1/2">{trailing}</span>}
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
