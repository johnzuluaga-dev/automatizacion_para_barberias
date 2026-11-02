import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ChoiceOption {
  value: string;
  /** Nombre accesible de la opción. */
  label: string;
  disabled?: boolean;
}

interface ChoiceGroupProps<T extends ChoiceOption> {
  name: string;
  legend: ReactNode;
  options: readonly T[];
  value: string;
  onChange: (value: string) => void;
  renderOption: (option: T, checked: boolean) => ReactNode;
  error?: string;
  hint?: ReactNode;
  className?: string;
  optionClassName?: string;
  /** id del grupo, para poder enfocarlo cuando hay error. */
  id?: string;
}

const optionBase =
  'relative flex cursor-pointer rounded-md border border-line-strong bg-surface text-ink ' +
  'transition-[border-color,background-color,box-shadow,color] duration-150 ease-out ' +
  'hover:border-ink/40 ' +
  'has-checked:border-accent has-checked:bg-accent-soft has-checked:shadow-[inset_0_0_0_1px_var(--accent)] ' +
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ' +
  'has-disabled:cursor-not-allowed has-disabled:border-line has-disabled:bg-surface-2/60 has-disabled:text-muted has-disabled:hover:border-line';

/** Tarjetas que se elevan al pasar el mouse (servicios y barberos); se pasa en `optionClassName`. */
export const CARD_LIFT =
  'transition-[border-color,background-color,box-shadow,color,translate] duration-200 ' +
  'hover:-translate-y-0.5 active:translate-y-0 has-disabled:hover:translate-y-0';

/**
 * Grupo de opciones con radios nativos: flechas del teclado, foco y lectores
 * de pantalla funcionan sin JavaScript adicional.
 */
export function ChoiceGroup<T extends ChoiceOption>({
  name,
  legend,
  options,
  value,
  onChange,
  renderOption,
  error,
  hint,
  className,
  optionClassName,
  id,
}: ChoiceGroupProps<T>) {
  const autoId = useId();
  const groupId = id ?? autoId;
  const errorId = `${groupId}-error`;

  return (
    <fieldset
      id={groupId}
      tabIndex={-1}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
      className="min-w-0 focus:outline-none"
    >
      <legend className="mb-3 w-full">{legend}</legend>
      {hint}
      <div className={className}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label key={option.value} className={cn(optionBase, optionClassName)}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={option.disabled}
                aria-label={option.label}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {renderOption(option, checked)}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-xs font-medium text-danger-text">
          {error}
        </p>
      )}
    </fieldset>
  );
}
