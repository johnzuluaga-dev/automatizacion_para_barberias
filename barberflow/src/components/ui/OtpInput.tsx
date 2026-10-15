import { useId, useLayoutEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Se llama cuando se completan todas las casillas. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  /** id del mensaje de error/ayuda asociado. */
  describedBy?: string;
  autoFocus?: boolean;
}

/**
 * Código de un solo uso en casillas separadas: avanza solo, retrocede con
 * Backspace, acepta pegar el código completo y expone autocomplete="one-time-code"
 * para que el teclado del celular sugiera el código recibido.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  invalid = false,
  describedBy,
  autoFocus = false,
}: OtpInputProps) {
  const groupId = useId();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // Valor más reciente, disponible antes del re-render (para los saltos de foco).
  const latest = useRef(value);
  useLayoutEffect(() => {
    latest.current = value;
  }, [value]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  function focusAt(index: number) {
    const el = refs.current[Math.max(0, Math.min(length - 1, index))];
    el?.focus();
    el?.select();
  }

  function commit(next: string) {
    const clean = next.replace(/\D/g, '').slice(0, length);
    latest.current = clean;
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  }

  function handleInput(index: number, raw: string) {
    const typed = raw.replace(/\D/g, '');
    if (!typed) return;
    // Algunos teclados insertan el código completo en una sola casilla.
    if (typed.length > 1) {
      commit(value.slice(0, index) + typed);
      focusAt(index + typed.length);
      return;
    }
    commit(value.slice(0, index) + typed + value.slice(index + 1));
    focusAt(index + 1);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        commit(value.slice(0, index));
      } else if (index > 0) {
        commit(value.slice(0, index - 1));
        focusAt(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(Math.min(index + 1, value.length));
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    commit(pasted);
    focusAt(pasted.length);
  }

  return (
    <div role="group" aria-labelledby={`${groupId}-label`} aria-describedby={describedBy} className="flex flex-col gap-2">
      <span id={`${groupId}-label`} className="sr-only">
        Código de verificación de {length} dígitos
      </span>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={length}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            autoFocus={autoFocus && i === 0}
            aria-label={`Dígito ${i + 1} de ${length}`}
            aria-invalid={invalid || undefined}
            disabled={disabled}
            value={digit}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => {
              if (i > latest.current.length) focusAt(latest.current.length);
              else e.target.select();
            }}
            className={cn(
              'tabular h-14 w-full rounded-md border bg-surface text-center font-display text-2xl font-semibold text-ink',
              'transition-[border-color,box-shadow] duration-150 ease-out',
              'focus:border-accent focus:ring-3 focus:ring-accent/20 focus:outline-none',
              'disabled:opacity-60',
              invalid ? 'border-danger' : digit ? 'border-ink/40' : 'border-line-strong',
            )}
          />
        ))}
      </div>
    </div>
  );
}
