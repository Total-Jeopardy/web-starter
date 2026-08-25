'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/core/network/api-client';
import { getTokenStorage } from '@/core/auth/token-storage-provider';
import { getAppLogger } from '@/core/logging/logging-providers';
import { useSessionStore } from '@/core/session/session-providers';
import { AuthRemoteSource } from '@/examples/reference-features/auth/data/sources/auth-remote-source';
import { AuthLocalSource } from '@/examples/reference-features/auth/data/sources/auth-local-source';
import { AuthRepositoryImpl } from '@/examples/reference-features/auth/data/repositories/auth-repository-impl';
import { LoginUseCase } from '@/examples/reference-features/auth/domain/use-cases/login-use-case';
import { LogoutUseCase } from '@/examples/reference-features/auth/domain/use-cases/logout-use-case';
import { RestoreAuthSessionUseCase } from '@/examples/reference-features/auth/domain/use-cases/restore-auth-session-use-case';
import { useAuthStore } from '@/examples/reference-features/auth/presentation/stores/auth-store';

/** Wires the reference-backend adapter together. See tool/generate_custom_auth_scaffold.py for the custom-backend equivalent. */
function buildDependencies() {
  const tokenStorage = getTokenStorage();
  const repository = new AuthRepositoryImpl(new AuthRemoteSource(getApiClient()), new AuthLocalSource());
  return {
    tokenStorage,
    repository,
    loginUseCase: new LoginUseCase(repository, tokenStorage),
    logoutUseCase: new LogoutUseCase(tokenStorage, repository),
    restoreUseCase: new RestoreAuthSessionUseCase(tokenStorage, repository),
  };
}

/**
 * Wraps the auth use-cases with TanStack Query mutations/queries — the
 * single entry point a login page or nav component should use. UI renders
 * and delegates; this hook and the use-cases it wraps own the transitions.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const authState = useAuthStore((s) => s.state);
  const setAuthState = useAuthStore((s) => s.setState);
  const setSessionAuthenticated = useSessionStore((s) => s.setAuthenticated);
  const setSessionGuest = useSessionStore((s) => s.setGuest);
  const logger = getAppLogger();

  const restoreQuery = useQuery({
    queryKey: ['reference-auth', 'restore-session'],
    queryFn: async () => {
      const { restoreUseCase } = buildDependencies();
      const user = await restoreUseCase.execute();
      if (user) {
        setAuthState({ status: 'authenticated', user });
        setSessionAuthenticated({ userId: user.id, displayName: user.userName });
      } else {
        setSessionGuest();
      }
      return user;
    },
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ phone, password }: { phone: string; password: string }) => {
      setAuthState({ status: 'loading' });
      const { loginUseCase } = buildDependencies();
      const result = await loginUseCase.execute(phone, password);
      if (!result.ok) {
        setAuthState({ status: 'error', message: result.error.message });
        throw new Error(result.error.message);
      }
      return result.value;
    },
    onSuccess: (tokens) => {
      const user = { id: tokens.id, userName: tokens.userName, role: tokens.role };
      setAuthState({ status: 'authenticated', user });
      setSessionAuthenticated({ userId: user.id, displayName: user.userName });
      void queryClient.invalidateQueries({ queryKey: ['reference-auth'] });
      logger.info('User logged in', { userId: user.id });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { logoutUseCase } = buildDependencies();
      await logoutUseCase.execute();
    },
    onSuccess: () => {
      setAuthState({ status: 'initial' });
      setSessionGuest();
      queryClient.clear();
      logger.info('User logged out');
    },
  });

  return {
    authState,
    isRestoring: restoreQuery.isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}
