import type { Result, ApiError } from '@/core/network/api-result';
import type { AuthTokens } from '@/examples/reference-features/auth/domain/entities/auth-tokens';

/** Fake for `LoginUseCase` — same `execute(phone, password)` shape, for presentation-layer tests. */
export class FakeLoginUseCase {
  executeCalls: Array<{ phone: string; password: string }> = [];

  private result: Result<AuthTokens, ApiError> = {
    ok: false,
    error: { message: 'FakeLoginUseCase.execute was not configured' },
  };

  setResult(result: Result<AuthTokens, ApiError>): void {
    this.result = result;
  }

  async execute(phone: string, password: string): Promise<Result<AuthTokens, ApiError>> {
    this.executeCalls.push({ phone, password });
    return this.result;
  }
}
