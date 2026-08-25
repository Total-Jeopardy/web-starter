export type ThemeMode = 'light' | 'dark' | 'system';

/** Resolves 'system' against the OS-level media query; passes concrete modes through. */
export function resolveThemeMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
