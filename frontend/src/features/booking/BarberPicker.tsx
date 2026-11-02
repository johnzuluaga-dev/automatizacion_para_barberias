import { m } from 'motion/react';
import { CARD_LIFT, ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { cn } from '@/lib/utils';
import { initials, type Barber } from './catalog';
import { StepLegend } from './StepLegend';

interface BarberPickerProps {
  barbers: readonly Barber[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function BarberPicker({ barbers, value, onChange, error }: BarberPickerProps) {
  const options = barbers.map((b) => ({ value: b.id, label: b.name }));
  return (
    <ChoiceGroup
      id="field-barber"
      name="barber"
      legend={<StepLegend step={2} title="Barbero" />}
      options={options}
      value={value}
      onChange={onChange}
      error={error}
      className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
      optionClassName={cn('items-center gap-3 p-3 sm:flex-col sm:items-start sm:p-4', CARD_LIFT)}
      renderOption={(option, checked) => (
        <>
          {/* El avatar hace un pequeño "pop" al elegir al barbero. */}
          <m.span
            aria-hidden
            animate={{ scale: checked ? [1, 1.15, 1] : 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-full font-display text-base font-bold transition-colors duration-150',
              checked ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink',
            )}
          >
            {initials(option.label)}
          </m.span>
          <span className="font-medium leading-tight">{option.label}</span>
        </>
      )}
    />
  );
}
