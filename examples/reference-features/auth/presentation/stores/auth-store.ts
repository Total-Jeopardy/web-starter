import { create } from 'zustand';
import { type AuthState, initialAuthState } from '@/examples/reference-features/auth/domain/entities/auth-state';

interface AuthStoreState {
  state: AuthState;
  setState: (state: AuthState) => void;
}

/**
 * Zustand slice for client-only auth UI state — loading/error/authenticated
 * flags for the login form. NEVER holds tokens; those stay in
 * `core/auth/token-storage-provider.ts`.
 */
export const useAuthStore = create<AuthStoreState>((set) => ({
  state: initialAuthState,
  setState: (state) => set({ state }),
}));
