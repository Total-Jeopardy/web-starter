import type { Result, ApiError } from '@/core/network/api-result';

export interface AuthSession {
  userId: string;
  displayName?: string;
}

/**
 * The contract every auth adapter implements (`none`, `reference_backend`,
 * or a project's `custom_backend`). `middleware.ts` and
 * `core/session/session-providers.ts` only ever talk to this interface —
 * never to a specific backend SDK.
 */
export interface AuthAdapter {
  /** Resolves the current session, if any, without throwing. */
  checkSession(): Promise<Result<AuthSession | null, ApiError>>;
  login(credentials: unknown): Promise<Result<AuthSession, ApiError>>;
  logout(): Promise<Result<void, ApiError>>;
  refresh(): Promise<Result<void, ApiError>>;
}

/**
 * The no-op adapter used by the default `none` provider. Always reports
 * "no session" and never claims to be able to log in — the default boot
 * path ships no login screen.
 */
export class NoAuthAdapter implements AuthAdapter {
  async checkSession(): Promise<Result<AuthSession | null, ApiError>> {
    return { ok: true, value: null };
  }

  async login(): Promise<Result<AuthSession, ApiError>> {
    return {
      ok: false,
      error: { message: 'No auth provider is configured (NEXT_PUBLIC_AUTH_PROVIDER=none).' },
    };
  }

  async logout(): Promise<Result<void, ApiError>> {
    return { ok: true, value: undefined };
  }

  async refresh(): Promise<Result<void, ApiError>> {
    return { ok: true, value: undefined };
  }
}
