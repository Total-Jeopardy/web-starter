import type { SessionState } from '@/core/session/session-state';
import type { RouteAccess } from '@/core/router/route-registry';

/**
 * Pure redirect decision function, consumed by `middleware.ts`. Kept pure
 * and framework-agnostic (no `NextRequest`/`NextResponse` here) so it's
 * trivially unit-testable — see the equivalent `redirectForSession` in the
 * Flutter template's `app_router.dart`.
 *
 * Returns the path to redirect to, or `null` to allow the request through.
 * `unknown` session state never redirects — the session check may still be
 * in flight.
 */
export function redirectForSession(params: {
  session: SessionState;
  access: RouteAccess;
  signInPath: string;
  signedInPath: string;
}): string | null {
  const { session, access, signInPath, signedInPath } = params;

  if (session.status === 'unknown') return null;

  if (session.status === 'authenticated' && access === 'guestOnly') {
    return signedInPath;
  }
  if (session.status === 'guest' && access === 'authenticated') {
    return signInPath;
  }
  return null;
}
