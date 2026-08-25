import { NextResponse, type NextRequest } from 'next/server';
import { accessForPath } from '@/core/router/route-registry';
import { redirectForSession } from '@/core/router/route-guards';
import type { SessionState } from '@/core/session/session-state';

/**
 * Router ownership doctrine: auth/session gating is owned by this file, NOT
 * by imperative `router.push()` calls scattered through components. This is
 * the direct web analogue of "auth navigation owned by GoRouter redirect
 * logic" in the Flutter template's `app_router.dart`.
 *
 * IMPORTANT — this is a coarse UX gate only. It reads a lightweight
 * session cookie hint to decide whether to redirect toward or away from
 * `/login`; it does NOT and cannot perform real authorization. Real
 * authorization must always happen server-side, on whatever backend the
 * project wires in. Treat every redirect decision here as "better UX", not
 * "security boundary."
 *
 * The template itself ships no authenticated route groups — only
 * `(no-auth)` and, optionally, `(reference-auth)` — so this middleware is a
 * no-op in the default boot path. A project adds authenticated route
 * groups on top and registers them in `core/router/route-registry.ts`.
 */
const SESSION_HINT_COOKIE = 'session_hint';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const access = accessForPath(pathname);

  const hasSessionHint = request.cookies.has(SESSION_HINT_COOKIE);
  const session: SessionState = hasSessionHint
    ? { status: 'authenticated', session: { userId: 'unknown' } }
    : { status: 'guest' };

  const redirectPath = redirectForSession({
    session,
    access,
    signInPath: '/login',
    signedInPath: '/',
  });

  if (redirectPath && redirectPath !== pathname) {
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
