/**
 * Global Vitest setup — loaded once via `vitest.config.ts`'s `setupFiles`.
 *
 * `@testing-library/jest-dom/vitest` self-registers its matchers (`toBeInTheDocument()`,
 * etc.) against Vitest's `expect` on import — no extra `expect.extend()` call needed
 * for jest-dom v6+ with Vitest.
 */
import '@testing-library/jest-dom/vitest';
import React from 'react';

// `vitest.config.ts` does not register `@vitejs/plugin-react`, so esbuild
// transforms `.tsx` under the classic JSX runtime (`React.createElement(...)`)
// rather than the automatic one — every `.tsx` file under test, and every
// `.tsx` source file it renders (e.g. LoginForm), needs `React` resolvable as
// a bare identifier at runtime. Exposing it as a global here covers both
// without needing a per-file `import React from 'react'` in source files we
// don't own.
(globalThis as { React?: typeof React }).React = React;

// jsdom does not implement `window.matchMedia`. `core/design-system/theme.ts` and
// `core/design-system/theme-mode-provider.tsx` call it unconditionally, so every test
// that touches theme resolution needs a stub. Individual tests may override this with
// their own mock implementation to assert light/dark branches.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// jsdom only implements `window.localStorage`/`window.sessionStorage` for a
// non-opaque origin (i.e. when the environment is configured with a real
// `url`). `vitest.config.ts` doesn't set one, so both are `undefined` here
// by default even though `typeof window !== 'undefined'`. Several core
// modules (AuthLocalSource, BrowserTokenStorage's sessionStorage analogue,
// core/storage/client-cache.ts) touch these directly, so polyfill a minimal
// in-memory Storage implementation when the real one is missing.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
}

if (typeof window !== 'undefined') {
  if (!window.localStorage) {
    Object.defineProperty(window, 'localStorage', { value: createMemoryStorage(), configurable: true });
  }
  if (!window.sessionStorage) {
    Object.defineProperty(window, 'sessionStorage', { value: createMemoryStorage(), configurable: true });
  }
}

// jsdom does not implement `crypto.randomUUID` in all environments. Several core
// modules (request-correlation, app-toast) call it; fall back to a simple polyfill
// so tests don't crash on environments where it's missing.
if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
  (crypto as { randomUUID?: () => string }).randomUUID = () =>
    `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`;
}
