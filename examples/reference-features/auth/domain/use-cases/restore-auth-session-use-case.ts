import type { TokenStorage } from '@/core/auth/token-storage-provider';
import type { AuthRepository } from '@/examples/reference-features/auth/domain/repositories/auth-repository';
import type { User } from '@/examples/reference-features/auth/domain/entities/user';

export class RestoreAuthSessionUseCase {
  constructor(
    private readonly tokenStorage: TokenStorage,
    private readonly authRepository: AuthRepository,
  ) {}

  async execute(): Promise<User | null> {
    const accessToken = await this.tokenStorage.getAccessToken();
    const user = await this.authRepository.readPersistedUser();

    const hasAccessToken = Boolean(accessToken);

    if (hasAccessToken && user) {
      return user;
    }

    if (hasAccessToken || user) {
      await this.tokenStorage.clearTokens();
      await this.authRepository.clearPersistedSession();
    }

    return null;
  }
}
