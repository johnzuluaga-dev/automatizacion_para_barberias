import { useCallback, useEffect, useState } from 'react';
import { getTakenSlots } from '@/lib/supabase';

interface Entry {
  key: string;
  slots: ReadonlySet<string>;
}

const EMPTY: ReadonlySet<string> = new Set();

/** Horas ya reservadas para el barbero y día elegidos. */
export function useTakenSlots(barber: string, date: string) {
  const key = barber && date ? `${barber}|${date}` : '';
  const [entry, setEntry] = useState<Entry | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!key) return;
    let active = true;
    void getTakenSlots(barber, date).then((slots) => {
      if (active) setEntry({ key, slots: new Set(slots) });
    });
    return () => {
      active = false;
    };
  }, [key, barber, date, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  return {
    taken: entry && entry.key === key ? entry.slots : EMPTY,
    loading: Boolean(key) && (!entry || entry.key !== key),
    refresh,
  };
}
