# Next.js Backend Skill

> Typed fetch client, `Result<T,E>` error handling, auth tokens, error envelopes, client-side storage. AI follows this when adding API endpoints, modifying the network layer, or working with storage.

---

## Stack Alignment

- **HTTP:** `core/network/api-client.ts` — typed `fetch` wrapper, one shared instance via `getApiClient()`
- **Auth:** bearer tokens via `core/auth/token-storage-provider.ts`, or cookie-based via `credentials: 'include'` (adapter-dependent)
- **Client storage:** `core/storage/client-cache.ts` for non-sensitive values only
- **Error contract:** `Result<T,E>` discriminated union — never raw thrown exceptions for expected failures

## When To Use

Use this skill when adding or changing repository methods, request/response DTOs, auth-aware network behavior, or client-side persistence that sits next to API work.

Reference patterns:
- `skills/references/repository-pattern.md`
- `skills/references/auth-guarded-route.md`
- `skills/references/template-invariants.md`
- `skills/references/use-case-pattern.md`
- `skills/references/clean-code-doctrine.md`
- `skills/assets/repository-template.ts.txt`

---

## Result<T,E> Pattern

Every repository/use-case method returns `Result<T,E>`. TypeScript's discriminated union forces every caller to check `.ok` before touching `.value` or `.error`. Nothing is silently swallowed.

```typescript
// Definition (already in core/network/api-result.ts)
export type Result<T, E = ApiError> = { ok: true; value: T } | { ok: false; error: E };

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
}

// Calling a repository method
const result = await productRepository.getProducts();
if (result.ok) {
  // use result.value
} else {
  // use result.error — compiler won't let you read .value here
}
```

At the TanStack Query boundary, unwrap into a thrown error with `unwrapOrThrow` — that's the one sanctioned place a `Result` becomes a throw, because `useQuery`/`useMutation` model failure via rejected promises:

```typescript
import { unwrapOrThrow } from '@/core/network/api-result';

const { data } = useQuery({
  queryKey: ['products'],
  queryFn: async () => unwrapOrThrow(await productRepository.getProducts()),
});
```

---

## Adding a New API Endpoint

### Step 1 — Add method to the source

```typescript
// features/orders/data/sources/order-remote-source.ts
import type { ApiClient } from '@/core/network/api-client';
import type { Result, ApiError } from '@/core/network/api-result';

export class OrderRemoteSource {
  constructor(private readonly api: ApiClient) {}

  getOrder(orderId: string): Promise<Result<OrderDto, ApiError>> {
    return this.api.get<OrderDto>(`/api/v1/orders/${orderId}`);
  }

  createOrder(request: CreateOrderRequest): Promise<Result<OrderDto, ApiError>> {
    return this.api.post<OrderDto>('/api/v1/orders', request);
  }
}
```

### Step 2 — Map DTOs into entities in the repository

```typescript
// features/orders/data/repositories/order-repository-impl.ts
export class OrderRepositoryImpl implements OrderRepository {
  constructor(private readonly remote: OrderRemoteSource) {}

  async getOrder(orderId: string): Promise<Result<Order, ApiError>> {
    const result = await this.remote.getOrder(orderId);
    if (!result.ok) return result;
    return { ok: true, value: { id: result.value.id, status: result.value.status } };
  }
}
```

### Step 3 — Call from a hook

```typescript
// features/orders/presentation/hooks/use-place-order.ts
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: CreateOrderRequest) => unwrapOrThrow(await orderRepository.createOrder(request)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}
```

If the action touches more than one dependency, persists tokens/cache, branches on business rules, or is likely to be reused, stop here and introduce a use-case instead of growing the hook.

```typescript
export class PlaceOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
  ) {}

  async execute(request: CreateOrderRequest): Promise<Result<Order, ApiError>> {
    const result = await this.orderRepository.createOrder(request);
    if (result.ok) await this.cartRepository.clear();
    return result;
  }
}
```

---

## ApiClient Rules

`core/network/api-client.ts` is the template's network boundary. These rules are locked:

| Rule | Reason |
|---|---|
| No React/TanStack Query dependency inside `ApiClient` | Keeps it pure infrastructure; testable without React |
| Auth header injected inside `request()` from `TokenStorage` | Single place to manage bearer token |
| `onUnauthorized` callback fires on a 401 | Avoids the client hardcoding a redirect; caller wires session invalidation |
| Base URL from `core/config/app-config.ts` (`NEXT_PUBLIC_API_BASE_URL`) | Never hardcoded; different per environment |
| Error envelope field-name mapping is configurable | `core/network/error-envelope.ts` — NOT hardcoded to one backend's shape (e.g. not assumed RFC 7807) |

## Responsibility Split

| Layer | Owns |
|---|---|
| Source | raw network/storage access and DTO shape |
| Repository | response mapping into domain entities |
| Use-case | business orchestration across one or more dependencies |
| Hook | UI-facing loading/success/error state via TanStack Query |
| Component | rendering and event dispatch |

### Custom request options

```typescript
// core/network/api-client.ts already supports per-request query/headers/signal:
const result = await api.get<Product[]>('/api/v1/products', {
  query: { category: 'shoes' },
  signal: abortController.signal,
});
```

---

## Storage Rules

### Which storage to use

| Data Type | Storage | Why |
|---|---|---|
| Bearer access/refresh token | `core/auth/token-storage-provider.ts` (`TokenStorage`) | Isolated boundary, swappable persistence (`sessionStorage` by default) |
| Session-cookie-based auth | Nothing client-side — rely on `credentials: 'include'` | Backend owns the cookie |
| Theme preference | `core/storage/client-cache.ts` | Non-sensitive, fast |
| Onboarding flags | `core/storage/client-cache.ts` | Non-sensitive |
| Cached API responses | TanStack Query cache (in-memory) | Already has staleness/invalidation semantics; don't duplicate into `localStorage` |
| User PII (name, email) | Server state via TanStack Query, not persisted client-side beyond the session | Sensitive |

**Rule: tokens never touch `client-cache.ts`. Non-sensitive data never needs `TokenStorage`.**

### Using `client-cache.ts`

```typescript
import { clientCache } from '@/core/storage/client-cache';

// Reading
const theme = clientCache.get<string>('theme') ?? 'system';

// Writing
clientCache.set('theme', 'dark');

// Deleting
clientCache.remove('theme');
```

---

## Request/Response DTOs

Always type the request body and response shape explicitly — never pass an inline object literal with no type to `api.post`:

```typescript
export interface CreateOrderRequest {
  productId: string;
  quantity: number;
}

export interface OrderDto {
  id: string;
  status: string;
}
```

---

## Error Handling Patterns

### Status code handling in a hook

```typescript
const result = await orderRepository.createOrder(request);
if (!result.ok) {
  if (result.error.statusCode === 401) {
    // Session expired — middleware.ts will redirect on next navigation.
    return;
  }
  if (result.error.statusCode === 422) {
    setFieldErrors(result.error.message);
    return;
  }
  appToast.error(result.error.message);
}
```

### Retry pattern

TanStack Query already retries by default (`defaultOptions.queries.retry` in `app/providers.tsx`). For a manual retry button:

```typescript
const { error, refetch } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });
// ...
error && <AppErrorState onRetry={() => refetch()} />
```

---

## Anti-Patterns

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| `throw` from a repository for an expected HTTP failure | Return `{ ok: false, error }` |
| Persist tokens or cache in components/hooks when a use-case fits better | Keep orchestration in a verb-named use-case |
| `try/catch` in a component for network errors | Handle via `Result` check or read the query's `error` |
| Hardcode `http://` base URL | `core/config/app-config.ts` (`NEXT_PUBLIC_API_BASE_URL`) |
| Store tokens in `client-cache.ts` or plain `localStorage` | `core/auth/token-storage-provider.ts` only |
| `response.json() as any` without a type | Explicit DTO interface + typed `api.get<T>` |
| Call `fetch` directly in a feature file | `core/network/api-client.ts` via `getApiClient()` |
| Multiple ad-hoc API client instances | One shared `getApiClient()`, or an explicit instance for a distinct base URL |

---

## Backend Integration Checklist

- [ ] Source method returns `Result<T,E>` — not a raw DTO or thrown exception
- [ ] Request DTO is a named interface — not an inline object literal
- [ ] Response DTO is a named interface
- [ ] Repository maps DTO → domain entity
- [ ] Hook unwraps `Result` into TanStack Query state via `unwrapOrThrow` or explicit branching
- [ ] Component handles loading, data, and error states
- [ ] Sensitive data uses `core/auth/token-storage-provider.ts`
- [ ] API base URL not hardcoded
- [ ] Protected-route changes still match `skills/references/auth-guarded-route.md`
