import type { Result, ApiError } from '@/core/network/api-result';
import type { AuthRepository } from '@/examples/reference-features/auth/domain/repositories/auth-repository';
import type { AuthTokens } from '@/examples/reference-features/auth/domain/entities/auth-tokens';
import type { User } from '@/examples/reference-features/auth/domain/entities/user';
import type { AuthRemoteSource } from '@/examples/reference-features/auth/data/sources/auth-remote-source';
import type { AuthLocalSource } from '@/examples/reference-features/auth/data/sources/auth-local-source';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(
    private readonly remote: AuthRemoteSource,
    private readonly local: AuthLocalSource,
  ) {}

  login(phone: string, password: string): Promise<Result<AuthTokens, ApiError>> {
    return this.remote.login(phone, password);
  }

  readPersistedUser(): Promise<User | null> {
    return this.local.readUser();
  }

  saveAuthenticatedUser(user: User): Promise<void> {
    return this.local.saveUser(user);
  }

  clearPersistedSession(): Promise<void> {
    return this.local.clearUser();
  }
}
