import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveThemeMode } from '@/core/design-system/theme';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('resolveThemeMode', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes concrete "light" through unchanged, without consulting matchMedia', () => {
    mockMatchMedia(true);
    expect(resolveThemeMode('light')).toBe('light');
  });

  it('passes concrete "dark" through unchanged, without consulting matchMedia', () => {
    mockMatchMedia(false);
    expect(resolveThemeMode('dark')).toBe('dark');
  });

  it('resolves "system" to "dark" when the OS prefers dark', () => {
    mockMatchMedia(true);
    expect(resolveThemeMode('system')).toBe('dark');
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });

  it('resolves "system" to "light" when the OS does not prefer dark', () => {
    mockMatchMedia(false);
    expect(resolveThemeMode('system')).toBe('light');
  });
});
