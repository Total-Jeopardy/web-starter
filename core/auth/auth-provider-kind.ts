/**
 * The set of auth adapters the template core knows how to resolve. `none`
 * is the default boot path — no login screen, no vendor SDK.
 * `reference_backend` wires in the example under
 * `examples/reference-features/auth/`. `custom_backend` is a permanent slot
 * for a project-specific adapter generated via
 * `tool/generate_custom_auth_scaffold.py` — never filled in by the template
 * itself.
 */
export type AuthProviderKind = 'none' | 'reference_backend' | 'custom_backend';

export function isAuthProviderKind(value: string): value is AuthProviderKind {
  return value === 'none' || value === 'reference_backend' || value === 'custom_backend';
}
