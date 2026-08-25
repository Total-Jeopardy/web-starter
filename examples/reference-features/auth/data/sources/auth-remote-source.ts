import type { ApiClient } from '@/core/network/api-client';
import type { Result, ApiError } from '@/core/network/api-result';
import type { AuthTokens } from '@/examples/reference-features/auth/domain/entities/auth-tokens';

interface LoginResponseBody {
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  id?: string;
  user_name?: string;
  userName?: string;
  role?: string;
}

/** Talks to the reference backend's `/auth/login` endpoint over `core/network/api-client.ts`. */
export class AuthRemoteSource {
  constructor(private readonly apiClient: ApiClient) {}

  async login(phone: string, password: string): Promise<Result<AuthTokens, ApiError>> {
    const result = await this.apiClient.post<LoginResponseBody>('auth/login', { phone, password });
    if (!result.ok) return result;

    const body = result.value;
    const accessToken = body.access_token ?? body.accessToken;
    const refreshToken = body.refresh_token ?? body.refreshToken;

    if (!accessToken || !refreshToken) {
      return { ok: false, error: { message: 'Login response was missing required tokens.' } };
    }

    return {
      ok: true,
      value: {
        accessToken,
        refreshToken,
        id: body.id ?? '',
        userName: body.user_name ?? body.userName ?? '',
        role: body.role ?? '',
      },
    };
  }
}
