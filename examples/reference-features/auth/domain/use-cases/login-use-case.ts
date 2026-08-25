import type { Result, ApiError } from '@/core/network/api-result';
import type { TokenStorage } from '@/core/auth/token-storage-provider';
import type { AuthRepository } from '@/examples/reference-features/auth/domain/repositories/auth-repository';
import { type AuthTokens, authTokensToUser } from '@/examples/reference-features/auth/domain/entities/auth-tokens';

/**
 * Use-cases are verb+noun classes with constructor DI (mirrors
 * flutter-starter's own use-case pattern) — never grown as extra branches
 * inside a hook. See skills/references/clean-code-doctrine.md.
 */
export class LoginUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenStorage: TokenStorage,
  ) {}

  async execute(phone: string, password: string): Promise<Result<AuthTokens, ApiError>> {
    const result = await this.authRepository.login(phone, password);
    if (!result.ok) return result;

    await this.tokenStorage.saveTokens(result.value.accessToken, result.value.refreshToken);
    await this.authRepository.saveAuthenticatedUser(authTokensToUser(result.value));
    return result;
  }
}
