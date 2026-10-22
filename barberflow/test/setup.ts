import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
});

// jsdom no implementa scrollTo.
window.scrollTo = () => {};

// Las rutas cargan con lazy(); el primer import en frío puede tardar varios segundos.
configure({ asyncUtilTimeout: 10000 });

// Los módulos que importan Firebase no deben iniciar un proyecto real en las pruebas.
vi.mock('../src/lib/firebase', () => ({ auth: { currentUser: null }, db: {} }));
