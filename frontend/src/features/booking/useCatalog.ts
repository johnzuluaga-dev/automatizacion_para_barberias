import { useCallback, useEffect, useState } from 'react';
import { getCatalog } from '@/lib/catalogo';
import type { Catalog } from './catalog';

interface State {
  catalog: Catalog | null;
  error: string | null;
}

let cached: Catalog | null = null;

/** Servicios y barberos desde Firestore; se guardan en memoria para no repetir la lectura. */
export function useCatalog() {
  const [state, setState] = useState<State>({ catalog: cached, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cached) return;
    let active = true;
    getCatalog().then(
      (catalog) => {
        cached = catalog;
        if (active) setState({ catalog, error: null });
      },
      () => {
        if (active) setState({ catalog: null, error: 'No pudimos cargar los servicios y barberos.' });
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ catalog: null, error: null });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, loading: !state.catalog && !state.error, retry };
}

/** Solo para pruebas: olvida el catálogo en memoria. */
export function resetCatalogCache() {
  cached = null;
}
