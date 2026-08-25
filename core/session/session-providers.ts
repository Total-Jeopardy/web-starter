import { create } from 'zustand';
import { type SessionState, initialSessionState } from '@/core/session/session-state';
import type { AuthSession } from '@/core/auth/auth-adapter';

interface SessionStore {
  state: SessionState;
  setAuthenticated: (session: AuthSession) => void;
  setGuest: () => void;
  reset: () => void;
}

/**
 * Session state lives in a Zustand store, hydrated from a `/me`-equivalent
 * TanStack Query call (see `examples/reference-features/auth/presentation/hooks/use-auth.ts`
 * for the pattern) — this store never reads a cookie or token directly.
 */
export const useSessionStore = create<SessionStore>((set) => ({
  state: initialSessionState,
  setAuthenticated: (session) => set({ state: { status: 'authenticated', session } }),
  setGuest: () => set({ state: { status: 'guest' } }),
  reset: () => set({ state: initialSessionState }),
}));

/** Convenience hook mirroring the Flutter template's `useSession()`-style accessor. */
export function useSession(): SessionState {
  return useSessionStore((s) => s.state);
}
