import { describe, expect, it } from 'vitest';
import { RestoreAuthSessionUseCase } from '@/examples/reference-features/auth/domain/use-cases/restore-auth-session-use-case';
import { FakeAuthRepository } from '@/test/fakes/fake-auth-repository';
import { FakeTokenStorage } from '@/test/fakes/fake-token-storage';

const USER = { id: 'user-1', userName: 'Ama', role: 'member' };

describe('RestoreAuthSessionUseCase', () => {
  it('returns the user when both an access token and a persisted user are present', async () => {
    const repository = new FakeAuthRepository();
    repository.persistedUser = USER;
    const tokenStorage = new FakeTokenStorage({ accessToken: 'access-1', refreshToken: 'refresh-1' });

    const useCase = new RestoreAuthSessionUseCase(tokenStorage, repository);
    const result = await useCase.execute();

    expect(result).toEqual(USER);
    // Neither should be cleared in the happy path.
    await expect(tokenStorage.getAccessToken()).resolves.toBe('access-1');
    expect(repository.clearPersistedSessionCallCount).toBe(0);
  });

  it('returns null and clears nothing when neither a token nor a user is present', async () => {
    const repository = new FakeAuthRepository();
    const tokenStorage = new FakeTokenStorage();

    const useCase = new RestoreAuthSessionUseCase(tokenStorage, repository);
    const result = await useCase.execute();

    expect(result).toBeNull();
    expect(repository.clearPersistedSessionCallCount).toBe(0);
  });

  it('returns null and clears both sides when only the token is present (partial state)', async () => {
    const repository = new FakeAuthRepository();
    repository.persistedUser = null;
    const tokenStorage = new FakeTokenStorage({ accessToken: 'access-1', refreshToken: 'refresh-1' });

    const useCase = new RestoreAuthSessionUseCase(tokenStorage, repository);
    const result = await useCase.execute();

    expect(result).toBeNull();
    await expect(tokenStorage.getAccessToken()).resolves.toBeNull();
    expect(repository.clearPersistedSessionCallCount).toBe(1);
  });

  it('returns null and clears both sides when only the persisted user is present (partial state)', async () => {
    const repository = new FakeAuthRepository();
    repository.persistedUser = USER;
    const tokenStorage = new FakeTokenStorage();

    const useCase = new RestoreAuthSessionUseCase(tokenStorage, repository);
    const result = await useCase.execute();

    expect(result).toBeNull();
    expect(repository.clearPersistedSessionCallCount).toBe(1);
    await expect(repository.readPersistedUser()).resolves.toBeNull();
  });
});
