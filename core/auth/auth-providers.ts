import { getAppConfig } from '@/core/config/app-config';
import { type AuthAdapter, NoAuthAdapter } from '@/core/auth/auth-adapter';
import type { AuthProviderKind } from '@/core/auth/auth-provider-kind';

/**
 * Resolves the active `AuthAdapter` from `NEXT_PUBLIC_AUTH_PROVIDER`.
 *
 * - `none` (default): `NoAuthAdapter` — no session ever, no login route
 *   reachable in the default boot path.
 * - `reference_backend`: the example adapter backing
 *   `examples/reference-features/auth/`. Wired lazily so the template core
 *   never imports example code eagerly.
 * - `custom_backend`: a permanent slot filled in by
 *   `tool/generate_custom_auth_scaffold.py`. Throws with a clear message
 *   until a project generates and registers its adapter.
 */
export function resolveAuthAdapter(kind: AuthProviderKind = getAppConfig().authProvider): AuthAdapter {
  switch (kind) {
    case 'none':
      return new NoAuthAdapter();
    case 'reference_backend':
      // Intentionally requires the caller to have wired the reference
      // adapter — see examples/reference-features/auth/data/repositories.
      // The template core does not import example code by default.
      throw new Error(
        'reference_backend auth is provided by examples/reference-features/auth. ' +
          'Wire its repository into your app composition instead of calling resolveAuthAdapter() directly for this kind.',
      );
    case 'custom_backend':
      throw new Error(
        'custom_backend auth has no adapter registered yet. Run ' +
          '`python tool/generate_custom_auth_scaffold.py <your_backend>` and register the generated adapter here.',
      );
    default: {
      const exhaustive: never = kind;
      throw new Error(`Unknown auth provider kind: ${String(exhaustive)}`);
    }
  }
}
