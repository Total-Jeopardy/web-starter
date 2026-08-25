import type { User } from '@/examples/reference-features/auth/domain/entities/user';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Stable user identifier when returned by the API. */
  id: string;
  /** Filled when the API includes a user object or top-level profile fields. */
  userName: string;
  role: string;
}

export function authTokensToUser(tokens: AuthTokens): User {
  return { id: tokens.id, userName: tokens.userName, role: tokens.role };
}
