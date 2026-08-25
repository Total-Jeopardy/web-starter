import type { TokenStorage } from '@/core/auth/token-storage-provider';
import type { AuthRepository } from '@/examples/reference-features/auth/domain/repositories/auth-repository';

export class LogoutUseCase {
  constructor(
    private readonly tokenStorage: TokenStorage,
    private readonly authRepository: AuthRepository,
  ) {}

  async execute(): Promise<void> {
    await this.tokenStorage.clearTokens();
    await this.authRepository.clearPersistedSession();
  }
}
