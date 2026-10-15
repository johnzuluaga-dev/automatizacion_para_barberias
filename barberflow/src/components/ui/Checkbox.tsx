import { useId, type ComponentProps, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: ReactNode;
  error?: string;
}

export function Checkbox({ id: idProp, label, error, className, ...props }: CheckboxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const errorId = `${id}-error`;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-ink">
        <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
          <input
            id={id}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'peer size-5 cursor-pointer appearance-none rounded-[6px] border bg-surface transition-colors duration-150',
              'checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              error ? 'border-danger' : 'border-line-strong hover:border-ink/40',
            )}
            {...props}
          />
          <Check aria-hidden strokeWidth={3} className="pointer-events-none absolute size-3.5 text-accent-ink opacity-0 peer-checked:opacity-100" />
        </span>
        <span className="leading-snug">{label}</span>
      </label>
      {error && (
        <p id={errorId} className="pl-8 text-xs font-medium text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
