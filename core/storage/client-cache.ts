/**
 * Thin `localStorage` wrapper for NON-SENSITIVE values only — UI
 * preferences, feature flags cached client-side, last-viewed tab. Never
 * store tokens or session data here; that's `core/auth/token-storage-provider.ts`.
 *
 * Safe to call during SSR — every method no-ops when `window` is undefined.
 */
export const clientCache = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can throw (quota, private mode) — non-critical, ignore.
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
