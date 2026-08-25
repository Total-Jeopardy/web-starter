import { describe, expect, it } from 'vitest';
import { AuthRepositoryImpl } from '@/examples/reference-features/auth/data/repositories/auth-repository-impl';
import { AuthLocalSource } from '@/examples/reference-features/auth/data/sources/auth-local-source';
import { FakeAuthRemoteSource } from '@/test/fakes/fake-auth-remote-source';

const TOKENS = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  id: 'user-1',
  userName: 'Ama',
  role: 'member',
};
const USER = { id: 'user-1', userName: 'Ama', role: 'member' };

describe('AuthRepositoryImpl', () => {
  it('login() delegates to the remote source with the given credentials', async () => {
    const remote = new FakeAuthRemoteSource();
    remote.setLoginResult({ ok: true, value: TOKENS });
    const local = new AuthLocalSource();

    const repository = new AuthRepositoryImpl(remote as never, local);
    const result = await repository.login('0551234567', 'password');

    expect(result).toEqual({ ok: true, value: TOKENS });
    expect(remote.loginCalls).toEqual([{ phone: '0551234567', password: 'password' }]);
  });

  it('propagates a login failure from the remote source unchanged', async () => {
    const remote = new FakeAuthRemoteSource();
    remote.setLoginResult({ ok: false, error: { message: 'Invalid credentials' } });
    const local = new AuthLocalSource();

    const repository = new AuthRepositoryImpl(remote as never, local);
    const result = await repository.login('0551234567', 'wrong');

    expect(result).toEqual({ ok: false, error: { message: 'Invalid credentials' } });
  });

  it('saveAuthenticatedUser()/readPersistedUser()/clearPersistedSession() delegate to the local source', async () => {
    const remote = new FakeAuthRemoteSource();
    const local = new AuthLocalSource();
    const repository = new AuthRepositoryImpl(remote as never, local);

    await expect(repository.readPersistedUser()).resolves.toBeNull();

    await repository.saveAuthenticatedUser(USER);
    await expect(repository.readPersistedUser()).resolves.toEqual(USER);
    await expect(local.readUser()).resolves.toEqual(USER);

    await repository.clearPersistedSession();
    await expect(repository.readPersistedUser()).resolves.toBeNull();
  });
});
