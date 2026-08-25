import type { User } from '@/examples/reference-features/auth/domain/entities/user';

/**
 * Client-only UI state for the auth flow (loading/error/authenticated).
 * NEVER holds tokens — those live in `core/auth/token-storage-provider.ts`.
 */
export type AuthState =
  | { status: 'initial' }
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'error'; message: string };

export const initialAuthState: AuthState = { status: 'initial' };
