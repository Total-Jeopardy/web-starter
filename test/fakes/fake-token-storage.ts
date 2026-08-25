import type { TokenStorage } from '@/core/auth/token-storage-provider';

/** In-memory TokenStorage fake for tests — implements the real interface, no mocking framework needed. */
export class FakeTokenStorage implements TokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(initial?: { accessToken?: string | null; refreshToken?: string | null }) {
    this.accessToken = initial?.accessToken ?? null;
    this.refreshToken = initial?.refreshToken ?? null;
  }

  async getAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  async getRefreshToken(): Promise<string | null> {
    return this.refreshToken;
  }

  async saveTokens(access: string, refresh: string): Promise<void> {
    this.accessToken = access;
    this.refreshToken = refresh;
  }

  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
  }
}
