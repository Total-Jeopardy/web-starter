# Next.js Testing Skill

> Unit, hook, and component tests for TanStack Query + Zustand + typed-fetch projects, using Vitest + Testing Library. AI follows this when writing, reviewing, or debugging tests.

## When To Use

Use this skill when adding new tests, deciding the minimum test surface for a feature, or checking whether the current template state justifies introducing a new test category.

Reference patterns:
- `skills/references/testing-expectations.md`
- `skills/references/use-case-pattern.md`
- `skills/references/clean-code-doctrine.md`
- `skills/assets/use-case-test-template.ts.txt`
- `skills/assets/component-test-template.tsx.txt`

Literal templates are intentionally shaped around the existing auth flow so new tests mirror a real local pattern instead of an abstract example.

---

## Test Type Selection

```
What are you testing?
├── Pure TypeScript logic (entity, mapper, util) → Unit test
├── Repository (fake source)                      → Unit test (fake)
├── Use-case (fake repository/token storage)       → Unit test (fake)
├── TanStack Query hook                            → Hook test (renderHook + QueryClientProvider)
├── Zustand store                                   → Unit test (call actions directly, assert state)
├── Single component rendering                      → Component test (Testing Library render)
├── `core/router/route-guards.ts`                    → Unit test (pure function, no mocking needed)
└── Full user flow across pages                      → Out of scope for this template as shipped — add an e2e runner deliberately, don't improvise one
```

---

## File Naming & Location

Mirror the source tree under `test/`:

```
test/
├── features/
│   └── orders/
│       ├── data/
│       │   └── repositories/
│       │       └── order-repository-impl.test.ts
│       ├── domain/
│       │   └── use-cases/
│       │       └── place-order-use-case.test.ts
│       └── presentation/
│           ├── hooks/
│           │   └── use-orders.test.ts
│           └── components/
│               └── orders-view.test.tsx
├── examples/
│   └── reference-features/
│       └── auth/
│           └── domain/
│               └── use-cases/
│                   └── login-use-case.test.ts
├── core/
│   ├── network/
│   │   └── api-result.test.ts
│   └── router/
│       └── route-guards.test.ts
├── architecture/
│   ├── core-import-boundary.test.ts
│   ├── template-defaults.test.ts
│   └── example-module-boundary.test.ts
└── fakes/
    ├── fake-auth-repository.ts
    └── fake-token-storage.ts
```

Test file suffix: `.test.ts` / `.test.tsx`. Always.

Current template state:
- `test/` exists with directories mirroring `core/`, `features/`, `examples/reference-features/`, plus `test/architecture/` and `test/fakes/`
- there is no end-to-end test runner configured yet
- CI runs `npm run test` automatically once `test/` has files in it

Minimum expectation once feature tests start:
- 1 repository success test
- 1 repository error test
- 1 use-case test for each non-trivial business action
- 1 hook test for the main state transition
- 1 component test for the primary rendered state

---

## Unit Testing — Use-Cases

Prefer direct fake-based unit tests for use-cases. They should be cheap to read and cheap to run.

```typescript
import { describe, expect, it } from 'vitest';
import { LoginUseCase } from '@/examples/reference-features/auth/domain/use-cases/login-use-case';
import { FakeAuthRepository } from '../../../../fakes/fake-auth-repository';
import { FakeTokenStorage } from '../../../../fakes/fake-token-storage';

describe('LoginUseCase', () => {
  it('saves tokens on success', async () => {
    const tokenStorage = new FakeTokenStorage();
    const useCase = new LoginUseCase(FakeAuthRepository.success(), tokenStorage);

    const result = await useCase.execute('0240000000', 'secret');

    expect(result.ok).toBe(true);
    expect(tokenStorage.savedAccessToken).toBe('access-token');
  });

  it('does not save tokens on failure', async () => {
    const tokenStorage = new FakeTokenStorage();
    const useCase = new LoginUseCase(FakeAuthRepository.error(), tokenStorage);

    const result = await useCase.execute('0240000000', 'wrong');

    expect(result.ok).toBe(false);
    expect(tokenStorage.savedAccessToken).toBeNull();
  });
});
```

## Unit Testing — Hooks (TanStack Query)

Wrap `renderHook` in a fresh `QueryClientProvider` per test so cache state never leaks between tests.

```typescript
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useOrders } from '@/features/orders/presentation/hooks/use-orders';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useOrders', () => {
  it('loads orders successfully', async () => {
    const { result } = renderHook(() => useOrders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
  });

  it('surfaces an error state on failure', async () => {
    // Repository/source wired to a fake that returns { ok: false, error } for this test.
    const { result } = renderHook(() => useOrders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

## Unit Testing — Zustand Stores

Call the store's actions directly and assert on `getState()` — no component needed.

```typescript
import { describe, expect, it, beforeEach } from 'vitest';
import { useAuthStore } from '@/examples/reference-features/auth/presentation/stores/auth-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ state: { status: 'initial' } });
  });

  it('transitions to authenticated', () => {
    useAuthStore.getState().setState({ status: 'authenticated', user: { id: '1', userName: 'Jane', role: 'client' } });

    expect(useAuthStore.getState().state.status).toBe('authenticated');
  });
});
```

## Unit Testing — Repository

Use a small fake source first. Reach for a mocking library only when a fake would be less readable than the thing it is replacing.

```typescript
class FakeOrderRemoteSource extends OrderRemoteSource {
  constructor(private readonly result: Result<OrderDto, ApiError>) {
    super({} as ApiClient);
  }
  getOrder(): Promise<Result<OrderDto, ApiError>> {
    return Promise.resolve(this.result);
  }
}
```

## Unit Testing — Pure Route Guards

`core/router/route-guards.ts` is deliberately pure — test it with plain input/output assertions, no mocking:

```typescript
import { describe, expect, it } from 'vitest';
import { redirectForSession } from '@/core/router/route-guards';

describe('redirectForSession', () => {
  it('does not redirect while session is unknown', () => {
    expect(
      redirectForSession({
        session: { status: 'unknown' },
        access: 'authenticated',
        signInPath: '/login',
        signedInPath: '/',
      }),
    ).toBeNull();
  });

  it('redirects a guest away from an authenticated-only route', () => {
    expect(
      redirectForSession({
        session: { status: 'guest' },
        access: 'authenticated',
        signInPath: '/login',
        signedInPath: '/',
      }),
    ).toBe('/login');
  });
});
```

---

## Component Testing

```typescript
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrdersView } from '@/features/orders/presentation/components/orders-view';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('OrdersView', () => {
  it('shows a skeleton while loading', () => {
    renderWithProviders(<OrdersView />);
    expect(screen.getByTestId('app-skeleton')).toBeInTheDocument();
  });

  it('shows the order list once loaded', async () => {
    renderWithProviders(<OrdersView />);
    expect(await screen.findByText('Order #1')).toBeInTheDocument();
  });

  it('shows a retry button on error', async () => {
    renderWithProviders(<OrdersView />);
    expect(await screen.findByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
```

---

## Fakes

Create these in `test/fakes/` for reuse:

```typescript
// test/fakes/fake-auth-repository.ts
export class FakeAuthRepository implements AuthRepository {
  private constructor(private readonly result: Result<AuthTokens, ApiError>) {}

  static success(): FakeAuthRepository {
    return new FakeAuthRepository({
      ok: true,
      value: { accessToken: 'access-token', refreshToken: 'refresh-token', id: '1', userName: 'Jane', role: 'client' },
    });
  }

  static error(): FakeAuthRepository {
    return new FakeAuthRepository({ ok: false, error: { message: 'Invalid credentials' } });
  }

  login(): Promise<Result<AuthTokens, ApiError>> {
    return Promise.resolve(this.result);
  }
  readPersistedUser(): Promise<User | null> {
    return Promise.resolve(null);
  }
  saveAuthenticatedUser(): Promise<void> {
    return Promise.resolve();
  }
  clearPersistedSession(): Promise<void> {
    return Promise.resolve();
  }
}
```

---

## Recommended Packages

Already installed — do not add another testing library without a specific gap it fills:

```json
"vitest": "^2.0.0",
"@testing-library/react": "^16.0.0",
"@testing-library/jest-dom": "^6.5.0",
"jsdom": "^25.0.0"
```

---

## Anti-Patterns

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| Test business logic only through component tests | Unit test use-cases/hooks separately |
| Real network calls in unit/hook/component tests | Fake the repository/source |
| Share one `QueryClient` across multiple tests | A fresh `QueryClient` per test (via `createWrapper()`) |
| `setTimeout`-based waits in tests | `waitFor` / `findBy*` queries |
| Skip testing error states | Test loading, data, AND error |
| Test implementation details (internal state shape) | Test behavior visible to the user/consumer |

---

## Testing Checklist

- [ ] Each repository method has a success and error unit test
- [ ] Each use-case has a unit test per non-trivial branch
- [ ] Each hook has tests for loading, success, and error states
- [ ] Each component test covers: loading state, data state, error state
- [ ] `core/router/route-guards.ts` changes have direct unit tests
- [ ] Fakes live in `test/fakes/` — not duplicated per test file
