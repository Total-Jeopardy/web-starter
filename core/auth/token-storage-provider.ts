/**
 * Token boundary for bearer-token auth adapters. Cookie-based adapters
 * (session cookies set by the backend) don't need this at all — they set
 * `credentials: 'include'` on `core/network/api-client.ts` and skip token
 * storage entirely. This interface exists so the *option* of bearer tokens
 * doesn't leak storage mechanics into feature code.
 */
export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  saveTokens(access: string, refresh: string): Promise<void>;
  clearTokens(): Promise<void>;
}

const ACCESS_KEY = 'auth.access_token';
const REFRESH_KEY = 'auth.refresh_token';

/**
 * Default browser-side token storage. Uses `sessionStorage` rather than
 * `localStorage` so tokens don't outlive the tab by default — swap this
 * implementation at the project layer if a different lifetime is needed.
 *
 * This is intentionally the ONLY place in the template that touches token
 * persistence directly. See skills/references/template-invariants.md.
 */
export class BrowserTokenStorage implements TokenStorage {
  async getAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem(ACCESS_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem(REFRESH_KEY);
  }

  async saveTokens(access: string, refresh: string): Promise<void> {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(ACCESS_KEY, access);
    window.sessionStorage.setItem(REFRESH_KEY, refresh);
  }

  async clearTokens(): Promise<void> {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(ACCESS_KEY);
    window.sessionStorage.removeItem(REFRESH_KEY);
  }
}

let sharedStorage: TokenStorage | undefined;

export function getTokenStorage(): TokenStorage {
  if (!sharedStorage) {
    sharedStorage = new BrowserTokenStorage();
  }
  return sharedStorage;
}
