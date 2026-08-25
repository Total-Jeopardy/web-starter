import type { Result, ApiError } from '@/core/network/api-result';
import type { AuthTokens } from '@/examples/reference-features/auth/domain/entities/auth-tokens';
import type { User } from '@/examples/reference-features/auth/domain/entities/user';

/**
 * Phone+password credential shape is intentionally concrete here, not
 * abstracted behind a generic `Credentials` type — mirrors the Flutter
 * template's own documented decision. See
 * docs/planning/template_genericization_decisions.md.
 */
export interface AuthRepository {
  login(phone: string, password: string): Promise<Result<AuthTokens, ApiError>>;
  readPersistedUser(): Promise<User | null>;
  saveAuthenticatedUser(user: User): Promise<void>;
  clearPersistedSession(): Promise<void>;
}
