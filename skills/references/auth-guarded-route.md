# Auth-Guarded Route Reference

This template protects auth through `middleware.ts` calling the pure
`redirectForSession` function in `core/router/route-guards.ts`.

```typescript
// core/router/route-guards.ts
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

// middleware.ts
export function middleware(request: NextRequest) {
  const access = accessForPath(request.nextUrl.pathname);
  const redirectPath = redirectForSession({ session, access, signInPath: '/login', signedInPath: '/' });
  if (redirectPath && redirectPath !== request.nextUrl.pathname) {
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }
  return NextResponse.next();
}
```

Rules:
- route access is enforced in `middleware.ts` via `core/router/route-registry.ts`, not just hidden in UI
- add new protected prefixes to `routeAccessRegistry`, not as inline path checks
- `redirectForSession` never redirects on `session.status === 'unknown'` — the session check may still be in flight
- do not trigger auth redirects with imperative `router.push()` in components
- this is a coarse UX gate only — real authorization always happens server-side
