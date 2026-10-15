import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { cn } from '@/lib/utils';
import { BARBEROS, initials } from './catalog';
import { StepLegend } from './StepLegend';

const options = BARBEROS.map((name) => ({ value: name, label: name }));

interface BarberPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function BarberPicker({ value, onChange, error }: BarberPickerProps) {
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
      optionClassName="items-center gap-3 p-3 sm:flex-col sm:items-start sm:p-4"
      renderOption={(option, checked) => (
        <>
          <span
            aria-hidden
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-full font-display text-base font-bold transition-colors duration-150',
              checked ? 'bg-accent text-accent-ink' : 'bg-accent-2-soft text-accent-2',
            )}
          >
            {initials(option.value)}
          </span>
          <span className="font-medium leading-tight">{option.value}</span>
        </>
      )}
    />
  );
}
