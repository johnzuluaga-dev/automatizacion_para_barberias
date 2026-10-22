import { Check } from 'lucide-react';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { cn } from '@/lib/utils';
import { formatPrice, type Service } from './catalog';
import { StepLegend } from './StepLegend';

interface ServicePickerProps {
  services: readonly Service[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ServicePicker({ services, value, onChange, error }: ServicePickerProps) {
  const options = services.map((s) => ({ value: s.id, label: `${s.name}, ${formatPrice(s.price)}`, name: s.name, price: s.price }));
  return (
    <ChoiceGroup
      id="field-service"
      name="service"
      legend={<StepLegend step={1} title="Servicio" />}
      options={options}
      value={value}
      onChange={onChange}
      error={error}
      className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
      optionClassName="min-h-20 items-end justify-between p-4"
      renderOption={(option, checked) => (
        <>
          <span className="max-w-[12ch] font-display text-lg leading-tight font-semibold">{option.name}</span>
          <span className={cn('tabular text-base font-medium', checked ? 'text-accent' : 'text-muted')}>
            {formatPrice(option.price)}
          </span>
          <span
            aria-hidden
            className={cn(
              'absolute top-3 right-3 grid size-5 place-items-center rounded-full border transition-colors duration-150',
              checked ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong',
            )}
          >
            {checked && <Check className="size-3" strokeWidth={3} />}
          </span>
        </>
      )}
    />
  );
}
