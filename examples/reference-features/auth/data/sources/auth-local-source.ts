import type { User } from '@/examples/reference-features/auth/domain/entities/user';

const PERSISTED_USER_KEY = 'reference_auth.persisted_user';

/**
 * Persists the (non-sensitive) user profile via `core/storage/client-cache.ts`.
 * Tokens themselves never pass through here — see
 * `core/auth/token-storage-provider.ts`.
 */
export class AuthLocalSource {
  async readUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(PERSISTED_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  async saveUser(user: User): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PERSISTED_USER_KEY, JSON.stringify(user));
  }

  async clearUser(): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(PERSISTED_USER_KEY);
  }
}
