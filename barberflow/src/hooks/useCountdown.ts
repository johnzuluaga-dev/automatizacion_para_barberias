import { useEffect, useState } from 'react';

/** Segundos que faltan hasta `until` (ms epoch); 0 cuando ya pasó. */
export function useCountdown(until: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until <= Date.now()) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= until) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, [until]);

  return Math.max(0, Math.ceil((until - now) / 1000));
}

export function formatSeconds(total: number): string {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
