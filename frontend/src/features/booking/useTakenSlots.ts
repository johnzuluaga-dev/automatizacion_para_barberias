import { useCallback, useEffect, useState } from 'react';
import { getBlocks, type Block } from '@/lib/catalogo';
import { getTakenSlots } from '@/lib/citas';

interface Entry {
  key: string;
  slots: ReadonlySet<string>;
  blocks: readonly Block[];
}

const EMPTY: ReadonlySet<string> = new Set();
const NO_BLOCKS: readonly Block[] = [];

/** Horas ya reservadas y bloqueos (vacaciones, descansos) del barbero y día elegidos. */
export function useTakenSlots(barberId: string, date: string) {
  const key = barberId && date ? `${barberId}|${date}` : '';
  const [entry, setEntry] = useState<Entry | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!key) return;
    let active = true;
    void Promise.all([getTakenSlots(barberId, date), getBlocks(barberId)]).then(([slots, blocks]) => {
      if (active) setEntry({ key, slots: new Set(slots), blocks });
    });
    return () => {
      active = false;
    };
  }, [key, barberId, date, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const current = entry && entry.key === key ? entry : null;

  return {
    taken: current?.slots ?? EMPTY,
    blocks: current?.blocks ?? NO_BLOCKS,
    loading: Boolean(key) && !current,
    refresh,
  };
}
