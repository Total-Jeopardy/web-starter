import { describe, expect, it } from 'vitest';
import { LogoutUseCase } from '@/examples/reference-features/auth/domain/use-cases/logout-use-case';
import { FakeAuthRepository } from '@/test/fakes/fake-auth-repository';
import { FakeTokenStorage } from '@/test/fakes/fake-token-storage';

describe('LogoutUseCase', () => {
  it('clears both the token storage and the persisted session', async () => {
    const repository = new FakeAuthRepository();
    repository.persistedUser = { id: 'user-1', userName: 'Ama', role: 'member' };
    const tokenStorage = new FakeTokenStorage({ accessToken: 'access-1', refreshToken: 'refresh-1' });

    const useCase = new LogoutUseCase(tokenStorage, repository);
    await useCase.execute();

    await expect(tokenStorage.getAccessToken()).resolves.toBeNull();
    await expect(tokenStorage.getRefreshToken()).resolves.toBeNull();
    expect(repository.clearPersistedSessionCallCount).toBe(1);
    await expect(repository.readPersistedUser()).resolves.toBeNull();
  });
});
