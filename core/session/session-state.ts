import type { AuthSession } from '@/core/auth/auth-adapter';

/**
 * Discriminated union mirroring the Flutter template's `SessionState`
 * (`SessionUnknown` / `SessionGuest` / `SessionAuthenticated`).
 * `SessionUnknown` is the initial state while the session check is in
 * flight — `middleware.ts` and route guards must never redirect on
 * `unknown`, only on a resolved state.
 */
export type SessionState =
  | { status: 'unknown' }
  | { status: 'guest' }
  | { status: 'authenticated'; session: AuthSession };

export const initialSessionState: SessionState = { status: 'unknown' };

export function isAuthenticated(state: SessionState): state is { status: 'authenticated'; session: AuthSession } {
  return state.status === 'authenticated';
}
