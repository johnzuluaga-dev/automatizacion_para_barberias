import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarPlus } from 'lucide-react';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { inputStyles } from '@/components/ui/TextField';
import { cn } from '@/lib/utils';
import { fromIsoDate, isClosedDay, isPastSlot, TIME_SLOTS, toIsoDate, upcomingDays } from './schedule';
import { StepLegend } from './StepLegend';

const VISIBLE_DAYS = 21;

interface DateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (iso: string) => void;
  onTimeChange: (slot: string) => void;
  dateError?: string;
  timeError?: string;
}

export function DateTimePicker({ date, time, onDateChange, onTimeChange, dateError, timeError }: DateTimePickerProps) {
  const [now] = useState(() => new Date());
  const today = toIsoDate(now);

  const days = useMemo(() => {
    const list = upcomingDays(VISIBLE_DAYS, now).map((d) => ({
      value: d.iso,
      label: `${format(d.date, "EEEE d 'de' MMMM", { locale: es })}${d.closed ? ', cerrado' : ''}`,
      disabled: d.closed,
      date: d.date,
      closed: d.closed,
    }));
    return list;
  }, [now]);

  const lastVisible = days[days.length - 1]?.value ?? today;
  const isFarDate = Boolean(date) && date > lastVisible;

  const slots = TIME_SLOTS.map((slot) => {
    const past = Boolean(date) && isPastSlot(date, slot, now);
    return { value: slot, label: slot, disabled: !date || past, past };
  });

  return (
    <div className="flex flex-col gap-7">
      <ChoiceGroup
        id="field-appointment_date"
        name="appointment_date"
        legend={<StepLegend step={3} title="Día" aside="Lun a Sáb · 11:00–20:00" />}
        options={days}
        value={date}
        onChange={onDateChange}
        error={dateError}
        className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:thin] [mask-image:linear-gradient(to_right,#000_85%,transparent)] sm:mx-0 sm:px-0"
        optionClassName="w-16 shrink-0 snap-start flex-col items-center gap-0.5 py-3"
        renderOption={(day) => (
          <>
            <span className="text-xs text-muted capitalize">{format(day.date, 'EEE', { locale: es }).replace('.', '')}</span>
            <span className={cn('tabular font-display text-xl font-semibold', day.closed && 'line-through decoration-1')}>
              {format(day.date, 'd')}
            </span>
            <span className="text-[0.6875rem] text-muted">
              {day.closed ? 'Cerrado' : day.value === today ? 'Hoy' : format(day.date, 'MMM', { locale: es }).replace('.', '')}
            </span>
          </>
        )}
        hint={
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
            <label htmlFor="other-date" className="inline-flex items-center gap-1.5">
              <CalendarPlus aria-hidden className="size-4" />
              ¿Más adelante?
            </label>
            <input
              id="other-date"
              type="date"
              min={today}
              value={isFarDate ? date : ''}
              onChange={(e) => onDateChange(e.target.value)}
              className={cn(inputStyles, 'h-9 w-auto rounded-sm px-2.5 text-sm')}
            />
            {isFarDate && (
              <span className="text-ink">
                {format(fromIsoDate(date), "EEEE d 'de' MMMM", { locale: es })}
                {isClosedDay(date) && ' · cerrado'}
              </span>
            )}
          </div>
        }
      />

      <ChoiceGroup
        id="field-appointment_time"
        name="appointment_time"
        legend={<StepLegend step={4} title="Hora" />}
        options={slots}
        value={time}
        onChange={onTimeChange}
        error={timeError}
        hint={!date ? <p className="mb-3 text-sm text-muted">Primero elige un día para ver las horas.</p> : undefined}
        className="grid grid-cols-3 gap-2 min-[420px]:grid-cols-4 sm:grid-cols-6"
        optionClassName="h-11 items-center justify-center text-sm font-medium tabular"
        renderOption={(slot) => <span className={cn(slot.past && 'line-through decoration-1')}>{slot.value}</span>}
      />
    </div>
  );
}
