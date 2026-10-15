import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
});

// jsdom no implementa scrollTo.
window.scrollTo = () => {};

// Las rutas cargan con lazy(); el primer import en frío puede tardar más de 1 s.
configure({ asyncUtilTimeout: 5000 });
