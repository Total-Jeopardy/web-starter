import type { Result, ApiError } from '@/core/network/api-result';
import type { AuthTokens } from '@/examples/reference-features/auth/domain/entities/auth-tokens';

/**
 * Fake for `AuthRemoteSource` — same shape (a `login(phone, password)`
 * method returning `Result<AuthTokens, ApiError>`), used to test
 * `AuthRepositoryImpl` without hitting `core/network/api-client.ts`.
 */
export class FakeAuthRemoteSource {
  loginCalls: Array<{ phone: string; password: string }> = [];

  private loginResult: Result<AuthTokens, ApiError> = {
    ok: false,
    error: { message: 'FakeAuthRemoteSource.login was not configured' },
  };

  setLoginResult(result: Result<AuthTokens, ApiError>): void {
    this.loginResult = result;
  }

  async login(phone: string, password: string): Promise<Result<AuthTokens, ApiError>> {
    this.loginCalls.push({ phone, password });
    return this.loginResult;
  }
}
