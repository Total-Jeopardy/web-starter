import type { Result, ApiError } from '@/core/network/api-result';
import type { AuthRepository } from '@/examples/reference-features/auth/domain/repositories/auth-repository';
import type { AuthTokens } from '@/examples/reference-features/auth/domain/entities/auth-tokens';
import type { User } from '@/examples/reference-features/auth/domain/entities/user';

/** In-memory AuthRepository fake for use-case tests — implements the real interface. */
export class FakeAuthRepository implements AuthRepository {
  persistedUser: User | null = null;
  saveAuthenticatedUserCalls: User[] = [];
  clearPersistedSessionCallCount = 0;

  private loginResult: Result<AuthTokens, ApiError> = {
    ok: false,
    error: { message: 'FakeAuthRepository.login was not configured' },
  };

  setLoginResult(result: Result<AuthTokens, ApiError>): void {
    this.loginResult = result;
  }

  async login(): Promise<Result<AuthTokens, ApiError>> {
    return this.loginResult;
  }

  async readPersistedUser(): Promise<User | null> {
    return this.persistedUser;
  }

  async saveAuthenticatedUser(user: User): Promise<void> {
    this.saveAuthenticatedUserCalls.push(user);
    this.persistedUser = user;
  }

  async clearPersistedSession(): Promise<void> {
    this.clearPersistedSessionCallCount += 1;
    this.persistedUser = null;
  }
}
