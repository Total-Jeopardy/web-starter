import { describe, expect, it } from 'vitest';
import { LoginUseCase } from '@/examples/reference-features/auth/domain/use-cases/login-use-case';
import { FakeAuthRepository } from '@/test/fakes/fake-auth-repository';
import { FakeTokenStorage } from '@/test/fakes/fake-token-storage';

const TOKENS = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  id: 'user-1',
  userName: 'Ama',
  role: 'member',
};

describe('LoginUseCase', () => {
  it('on success, saves both the tokens and the persisted user', async () => {
    const repository = new FakeAuthRepository();
    repository.setLoginResult({ ok: true, value: TOKENS });
    const tokenStorage = new FakeTokenStorage();

    const useCase = new LoginUseCase(repository, tokenStorage);
    const result = await useCase.execute('0551234567', 'password');

    expect(result).toEqual({ ok: true, value: TOKENS });
    await expect(tokenStorage.getAccessToken()).resolves.toBe('access-1');
    await expect(tokenStorage.getRefreshToken()).resolves.toBe('refresh-1');
    expect(repository.saveAuthenticatedUserCalls).toEqual([{ id: 'user-1', userName: 'Ama', role: 'member' }]);
  });

  it('on failure, saves neither tokens nor a persisted user', async () => {
    const repository = new FakeAuthRepository();
    repository.setLoginResult({ ok: false, error: { message: 'Invalid credentials' } });
    const tokenStorage = new FakeTokenStorage();

    const useCase = new LoginUseCase(repository, tokenStorage);
    const result = await useCase.execute('0551234567', 'wrong-password');

    expect(result).toEqual({ ok: false, error: { message: 'Invalid credentials' } });
    await expect(tokenStorage.getAccessToken()).resolves.toBeNull();
    expect(repository.saveAuthenticatedUserCalls).toEqual([]);
  });
});
