# Next.js Security Skill

> Token storage, route guards, role checks, secure network behavior, and local data boundaries for this Next.js starter template.

---

## Stack Alignment

This template already has:
- `core/auth/token-storage-provider.ts` (`TokenStorage` / `BrowserTokenStorage`)
- `core/auth/auth-adapter.ts` (`AuthAdapter` contract — `none` / `reference_backend` / `custom_backend`)
- `core/network/api-client.ts` with bearer injection and an `onUnauthorized` hook
- `useSessionStore()` / `useSession()` as the session source of truth
- `middleware.ts` + `core/router/route-guards.ts` for redirect enforcement
- `core/storage/client-cache.ts` for non-sensitive storage only

Use this skill when touching auth, roles, protected routes, token storage, logout, the API client, or feature access.

## When To Use

Read this skill before changing auth flows, route guards, role gating, token persistence, or any request behavior that depends on the current session.

Shared invariants:
- `skills/references/template-invariants.md`
- `skills/references/auth-guarded-route.md`
- `skills/references/use-case-pattern.md`

---

## Non-Negotiable Rules

| Rule | Reason |
|---|---|
| Bearer tokens only go through `core/auth/token-storage-provider.ts` | Isolated, swappable persistence boundary |
| `client-cache.ts` never stores tokens or secrets | It's for non-sensitive local data only |
| Role checks live in the use-case/hook layer and are enforced server-side, not scattered in components | Consistent, actually-enforced access control |
| `core/network/api-client.ts` owns auth headers | Prevents token leaks and duplicated logic |
| Logout clears tokens before returning to guest state | Avoids stale authorized requests |
| Do not log tokens, auth headers, OTPs, passwords, or refresh payloads | Logs are durable and exportable (`core/logging/` sinks can be remote) |
| `middleware.ts` is a UX gate only, never the sole authorization boundary | Client-visible logic can always be bypassed; the backend must enforce it too |

---

## Token Storage Boundary

Use the existing provider:

```typescript
import { getTokenStorage } from '@/core/auth/token-storage-provider';

const tokenStorage = getTokenStorage();
```

Correct usage in a use-case:

```typescript
export class LoginUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenStorage: TokenStorage,
  ) {}

  async execute(phone: string, password: string): Promise<Result<AuthTokens, ApiError>> {
    const result = await this.authRepository.login(phone, password);
    if (!result.ok) return result;

    await this.tokenStorage.saveTokens(result.value.accessToken, result.value.refreshToken);
    return result;
  }
}
```

Logout must clear tokens:

```typescript
export class LogoutUseCase {
  constructor(
    private readonly tokenStorage: TokenStorage,
    private readonly authRepository: AuthRepository,
  ) {}

  async execute(): Promise<void> {
    await this.tokenStorage.clearTokens();
    await this.authRepository.clearPersistedSession();
  }
}
```

Never pass a raw token into a component. Components may know whether a user is authenticated (via `useSession()`), not what their token is.

---

## Route Guards

Protect routes through `middleware.ts` + `core/router/route-guards.ts`, not component-level checks.

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
  if (session.status === 'authenticated' && access === 'guestOnly') return signedInPath;
  if (session.status === 'guest' && access === 'authenticated') return signInPath;
  return null;
}
```

For role-protected routes, extend `RouteAccess` and `route-registry.ts` rather than hardcoding checks inline:

```typescript
// core/router/route-registry.ts
export type RouteAccess = 'public' | 'guestOnly' | 'authenticated' | 'adminOnly';

export const routeAccessRegistry: RouteAccessRule[] = [
  { prefix: '/login', access: 'guestOnly' },
  { prefix: '/admin', access: 'adminOnly' },
];
```

Rules:
- UI may hide unavailable actions, but the route guard (and the backend) must enforce access
- Route access rules live in `route-registry.ts`, not inline `pathname.startsWith(...)` checks in components
- Avoid imperative auth redirects with `router.push()` from a component
- `middleware.ts` reading a session cookie hint is a coarse UX signal — the actual authorization decision must be re-checked server-side (Route Handler / backend), never trusted from the client alone

---

## Feature Gates

Use feature gates for product access, staged rollout, or role-specific UI.

```typescript
// core/session/feature-gates.ts (project-added, following the session pattern)
export type FeatureGate = 'booking' | 'favorites' | 'adminDashboard';

export function featureGatesForRole(role: string | undefined): Set<FeatureGate> {
  switch (role) {
    case 'admin':
      return new Set(['booking', 'favorites', 'adminDashboard']);
    case 'staff':
      return new Set(['booking', 'adminDashboard']);
    default:
      return new Set(['booking', 'favorites']);
  }
}
```

Use gates in UI only for visibility:

```typescript
const gates = featureGatesForRole(session.role);
if (gates.has('adminDashboard')) {
  return <AdminDashboardEntry />;
}
```

Still enforce the same gate in the route guard or repository/use-case layer when it protects real access — a hidden UI entry point is not a security boundary.

---

## Network Security

`core/network/api-client.ts` is the only place that should inject bearer auth:

```typescript
if (this.tokenStorage) {
  const token = await this.tokenStorage.getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
}
```

Rules:
- Repositories/sources do not read tokens directly — they receive an already-configured `ApiClient`
- Components never set auth headers
- The `onUnauthorized` callback (fired on a 401) is where session invalidation is wired — see `useAuth()`'s dependency wiring for the pattern
- Base URL comes from `core/config/app-config.ts` (`NEXT_PUBLIC_API_BASE_URL`)

When adding logging around requests, redact sensitive values:

```typescript
function redactHeaders(headers: Record<string, string>): Record<string, string> {
  return {
    ...headers,
    ...(headers.Authorization ? { Authorization: '<redacted>' } : {}),
    ...(headers.Cookie ? { Cookie: '<redacted>' } : {}),
  };
}
```

Do not log request bodies that contain passwords, OTPs, refresh tokens, card data, or personal identity documents. `core/logging/remote-sink.ts` ships data off-device once `REMOTE_LOG_URL` is set — anything logged there is durable and leaves the browser.

---

## Local Storage Classification

| Data | Storage |
|---|---|
| Access token | `core/auth/token-storage-provider.ts` |
| Refresh token | `core/auth/token-storage-provider.ts` |
| Password, OTP, reset code | Do not persist client-side at all |
| Role and display name from login response | `useSessionStore`/`useAuthStore`; persist only if the product requires surviving a refresh |
| Theme preference | `core/storage/client-cache.ts` |
| Onboarding flags | `core/storage/client-cache.ts` |
| Cached public/non-sensitive API response | TanStack Query cache (in-memory), not `client-cache.ts` |
| PII cache | Prefer no client-side persistence beyond the active session |

If a value can authorize an action, recover an account, impersonate a user, or expose sensitive identity data, do not put it in `client-cache.ts` or plain `localStorage`.

---

## Form And Input Security

For login and other sensitive forms:
- Use `type="password"` for passwords/PINs
- Do not put secrets in route params or query strings
- Do not keep password field values in Zustand/TanStack Query longer than the submit call
- Validate on the client for UX, but rely on the server for enforcement

```typescript
<Input
  id="password"
  name="password"
  type="password"
  autoComplete="current-password"
  required
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
```

---

## Error Messages

Security-sensitive errors should be useful without leaking internals.

| Situation | Good Message | Bad Message |
|---|---|---|
| Login failed | `Invalid phone or password.` | `No user exists for phone 024...` |
| Forbidden | `You do not have access to this area.` | `Role staff missing admin permission` |
| Session expired | Redirect to login | `Refresh token expired at ...` |
| API failure | Existing `ApiError.message` if safe | Stack trace / raw server body |

---

## Tests To Add

When changing auth/security behavior, add tests for:
- Successful login saves both tokens
- Login failure does not save tokens
- Logout clears tokens
- `redirectForSession` sends a guest user to `/login` for an `authenticated`-only route
- `redirectForSession` sends an authenticated user away from `/login`
- `redirectForSession` returns `null` while `session.status === 'unknown'`
- `ApiClient` does not attach a bearer token when `tokenStorage` is `null` (the `none` provider)

---

## Anti-Patterns

| NEVER | ALWAYS |
|---|---|
| Store tokens in `client-cache.ts` | Use `core/auth/token-storage-provider.ts` |
| Read a raw token in a component | Read `useSession()` / auth state |
| Add role checks only by hiding UI | Enforce in the route guard and backend too |
| Put secrets in logs or thrown error messages | Redact or omit them |
| Manually navigate on session changes | Let `middleware.ts` redirect |
| Duplicate `ApiClient` instances with custom auth logic | Use `getApiClient()` or explicit DI at the composition point |
| Persist passwords, OTPs, or reset tokens | Keep in memory only, briefly |

---

## Security Checklist

- [ ] Tokens only use `core/auth/token-storage-provider.ts`
- [ ] Logout clears token storage
- [ ] Protected routes are enforced in `middleware.ts` via `route-guards.ts`
- [ ] Role and feature-gate checks are centralized, not scattered
- [ ] UI hiding is not the only access control
- [ ] Sensitive logs are redacted or removed
- [ ] `client-cache.ts` contains no tokens, passwords, OTPs, or secrets
- [ ] API base URL comes from `core/config/app-config.ts`
- [ ] Tests cover login, logout, redirects, and role gates
