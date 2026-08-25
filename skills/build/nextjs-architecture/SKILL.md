# Next.js Architecture Skill

> Feature-first architecture with explicit sources/repositories, entities/use-cases, and hooks/stores/components. No cross-feature imports. AI follows this when creating new features, files, or restructuring code.

---

## Stack Alignment

This skill is written for the `web-starter` template:
- **Framework:** Next.js 14 App Router, React 18
- **Server state:** TanStack Query v5
- **Client state:** Zustand v4
- **HTTP:** `core/network/api-client.ts` + `Result<T,E>`
- **Storage:** `core/storage/client-cache.ts` (non-sensitive) + `core/auth/token-storage-provider.ts` (bearer tokens)

## When To Use

Use this skill when creating a new feature, reorganizing a feature folder, or checking whether a change still matches the template invariants in `skills/references/template-invariants.md`.

Clean-code references:
- `skills/references/clean-code-doctrine.md`
- `skills/references/use-case-pattern.md`
- `skills/references/definition-of-done.md`

---

## Feature Folder Structure

Every new feature follows this exact layout. No exceptions.

Canonical scaffold:
- `skills/references/feature-scaffold.md`
- `skills/assets/feature-scaffold-template.ts.txt`

```
features/your-feature/
  data/
    repositories/
      your-feature-repository-impl.ts
    sources/
      your-feature-remote-source.ts
  domain/
    entities/
      your-feature-item.ts
      your-feature-state.ts
    repositories/
      your-feature-repository.ts
    use-cases/                          # Preferred for non-trivial business actions
  presentation/
    hooks/
      use-your-feature.ts               # TanStack Query wiring, the component's entry point
    stores/
      your-feature-store.ts             # Zustand — client-only UI state
    components/
      your-feature-view.tsx             # Client Component — no business logic here
```

### Naming Convention

| Layer | File Suffix | Symbol Suffix |
|---|---|---|
| Repository contract | `-repository.ts` | `FeatureRepository` (interface) |
| Repository implementation | `-repository-impl.ts` | `FeatureRepositoryImpl` |
| Remote source | `-remote-source.ts` | `FeatureRemoteSource` |
| Entity | `-item.ts` / `-state.ts` | `FeatureItem`, `FeatureState` |
| Use-case | `-use-case.ts` | `VerbFeatureUseCase` |
| Hook | `use-feature.ts` | `useFeature` |
| Store | `feature-store.ts` | `useFeatureStore` |
| Component | `feature-view.tsx` | `FeatureView` |

---

## Layer Responsibilities

### `data/sources/` — Source
- Only layer that talks directly to `core/network/api-client.ts` or local storage
- Returns DTOs wrapped in `Result<T,E>` for network calls
- No UI/React knowledge

```typescript
// data/sources/product-remote-source.ts
import type { ApiClient } from '@/core/network/api-client';
import type { Result, ApiError } from '@/core/network/api-result';

export class ProductRemoteSource {
  constructor(private readonly api: ApiClient) {}

  getProducts(): Promise<Result<ProductDto[], ApiError>> {
    return this.api.get<ProductDto[]>('/api/v1/products');
  }
}
```

### `data/repositories/` — Repository implementation
- Composes sources and maps DTOs into domain entities
- Implements the domain repository contract
- Returns `Result<T,E>` and never leaks transport details

```typescript
// data/repositories/product-repository-impl.ts
export class ProductRepositoryImpl implements ProductRepository {
  constructor(private readonly remote: ProductRemoteSource) {}

  async getProducts(): Promise<Result<Product[], ApiError>> {
    const result = await this.remote.getProducts();
    if (!result.ok) return result;

    return { ok: true, value: result.value.map((dto) => ({ id: dto.id, name: dto.name })) };
  }
}
```

### `domain/entities/` — State
- Discriminated union covering every possible UI state
- No React, no TanStack Query, no Zustand imports — plain TypeScript
- Add `domain/use-cases/` when an action coordinates dependencies, persists tokens/cache, branches on business rules, or deserves direct unit tests

```typescript
// domain/entities/product-state.ts
export type ProductState =
  | { status: 'initial' }
  | { status: 'loading' }
  | { status: 'loaded'; products: Product[] }
  | { status: 'error'; message: string };
```

### `presentation/hooks/` — Hook
- Wraps `useQuery`/`useMutation` around the repository or use-case
- Calls the repository directly only for trivial flows
- Calls use-cases for non-trivial orchestration, then maps results into hook return values
- No component JSX, no direct DOM access

```typescript
// presentation/hooks/use-products.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { unwrapOrThrow } from '@/core/network/api-result';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => unwrapOrThrow(await productRepository.getProducts()),
  });
}
```

### `domain/use-cases/` — Use-cases
- Preferred default for non-trivial business logic
- Name them with verbs: `LoginUseCase`, `FetchProfileUseCase`, `SaveDraftUseCase`
- Keep them small and dependency-injected via constructor
- Return domain data or `Result<T,E>`; do not know about React

```typescript
// domain/use-cases/login-use-case.ts
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

Skip a use-case only when the hook is doing a simple one-step read or mutation with no branching and no secondary dependency.

### `presentation/stores/` — Store
- Zustand slice for client-only UI state (loading flags, selected filters, form-in-progress state)
- Never holds server data (that's TanStack Query's job) or tokens

```typescript
// presentation/stores/product-filter-store.ts
export const useProductFilterStore = create<ProductFilterStore>((set) => ({
  category: 'all',
  setCategory: (category) => set({ category }),
}));
```

### `presentation/components/` — Component
- Client Component (`'use client'`) if it reads a hook/store; Server Component only if it renders static content
- No business logic — calls hook methods and renders their state
- Handles loading, empty, error, and data states explicitly

```typescript
// presentation/components/products-view.tsx
'use client';

export function ProductsView() {
  const { data, isLoading, error, refetch } = useProducts();

  if (isLoading) return <AppSkeleton />;
  if (error) return <AppErrorState onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <AppEmptyState />;

  return (
    <ul className="space-y-2">
      {data.map((product) => (
        <ProductTile key={product.id} product={product} />
      ))}
    </ul>
  );
}
```

---

## Core Folder Rules

`core/` contains infrastructure. No business logic.

```
core/
├── auth/            → Auth adapter contract, token storage boundary
├── config/          → Zod-validated env, read once
├── design-system/   → Tokens, hand-authored ui/ primitives
├── logging/         → AppLogger with pluggable sinks
├── network/         → api-client.ts, Result<T,E>, error envelope, request correlation
├── router/          → route-guards.ts, route-registry.ts (middleware.ts consumes these)
├── session/         → Zustand session store + useSession()
├── shared/           → AppEmptyState, AppErrorState, AppSkeleton, AppToast, AppConfirmDialog
├── storage/          → client-cache.ts (localStorage, non-sensitive)
├── strings/          → app-strings.ts
└── utils/            → cn.ts and other pure functions
```

### Core Rules

| Rule | Reason |
|---|---|
| Features never import from other features | Prevents coupling; changes in one feature don't break others |
| Cross-feature shared state lives in `core/` | Single source of truth, no circular imports |
| `core/` never imports from `features/` | Infrastructure must not depend on business logic |
| `core/network/api-client.ts` has no React dependency | Testable without React; consumed via `getApiClient()` |
| Use-cases live in `domain/use-cases/` | Keeps orchestration out of components and thin hooks |
| Layouts are Server Components; anything with hooks is a Client Component | Explicit server/client boundary — see `app/providers.tsx` vs `app/layout.tsx` |

---

## Anti-Patterns

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| Business logic in a `-view.tsx` component | Logic in hook/use-case, component just renders |
| Multi-step orchestration inside a hook | Extract a verb-named use-case |
| `throw` across repository → presentation | Return `Result<T,E>`, unwrap at the hook boundary |
| Feature A imports from Feature B | Shared state → `core/` |
| `useEffect` + `useState` for data fetching | `useQuery`/`useMutation` |
| Imperative `router.push()` for auth redirects | Let `middleware.ts` + `route-guards.ts` handle it |
| Bearer tokens in `client-cache.ts` | `core/auth/token-storage-provider.ts` only |
| Hardcoded API URLs in a source file | `core/config/app-config.ts` |
| God components or giant JSX trees | Split sections, cards, and state components into smaller units |

---

## New Feature Checklist

When creating a new feature, confirm:

- [ ] Folder created under `features/your-feature/`
- [ ] `data/`, `domain/`, `presentation/` subfolders exist
- [ ] Repository returns `Result<T,E>` on every method
- [ ] State is a discriminated union
- [ ] Hook wraps `useQuery`/`useMutation`, not `useEffect` + `useState`
- [ ] Component handles loading, empty, data, and error states
- [ ] Zustand store (if any) holds only client-only UI state
- [ ] No cross-feature imports
- [ ] Route added under the correct `app/` route group if it has a page
- [ ] `skills/references/definition-of-done.md` is satisfied
