# Next.js State Skill

> TanStack Query v5 + Zustand v4 for the `web-starter` template. Use this when creating hooks, stores, cached reads, mutations, or UI-facing async state.

---

## Stack Alignment

This skill is written for this template:
- **Server state:** `@tanstack/react-query` v5 — `useQuery`, `useMutation`, `QueryClient` from `app/providers.tsx`
- **Client state:** `zustand` v4 — `create()`
- **Architecture:** feature-first with explicit `data/domain/presentation` sub-structure
- **Network:** repositories return `Result<T,E>`
- **Auth:** `useSession()` / `useSessionStore` (`core/session/session-providers.ts`) is the session source of truth
- **Router:** `middleware.ts` reacts to a session cookie hint; no manual auth navigation from state changes

State belongs in `presentation/hooks/` (TanStack Query) and `presentation/stores/` (Zustand). Domain state types may live in `domain/entities/` when the state is part of the feature contract.

## When To Use

Use this skill when creating hooks, stores, cache-backed page state, or auth/session-adjacent state behavior.

Reference patterns:
- `skills/references/state-patterns.md`
- `skills/references/testing-expectations.md`
- `skills/references/template-invariants.md`
- `skills/references/use-case-pattern.md`
- `skills/references/clean-code-doctrine.md`
- `skills/assets/query-hook-template.ts.txt`
- `skills/assets/store-slice-template.ts.txt`

---

## Hook And Store Placement

Every feature keeps its state code together:

```
features/orders/
  data/
    repositories/
      order-repository-impl.ts
    sources/
      order-remote-source.ts
  domain/
    entities/
      order-state.ts
    repositories/
      order-repository.ts
  presentation/
    hooks/
      use-orders.ts
    stores/
      order-filter-store.ts
    components/
      orders-view.tsx
```

```typescript
// presentation/hooks/use-orders.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { unwrapOrThrow } from '@/core/network/api-result';
import { getApiClient } from '@/core/network/api-client';
import { OrderRemoteSource } from '@/features/orders/data/sources/order-remote-source';
import { OrderRepositoryImpl } from '@/features/orders/data/repositories/order-repository-impl';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const repository = new OrderRepositoryImpl(new OrderRemoteSource(getApiClient()));
      return unwrapOrThrow(await repository.getOrders());
    },
  });
}
```

---

## TanStack Query vs Zustand — Decision Table

| Need | Use | Example |
|---|---|---|
| Data that originates from the server | `useQuery` | product list, order detail |
| Create/update/delete against the server | `useMutation` | place order, login |
| Client-only UI state not derived from the server | Zustand `create()` | filters, selected tab, form-in-progress |
| Cross-feature shared client state | Zustand store in `core/` | `useSessionStore` |
| Parameterized server read | `useQuery` with the param in the key | `['orders', orderId]` |
| Derived/computed value from server data | `select` option on `useQuery`, or compute in the component | filtered/sorted list |

Default to `useQuery`/`useMutation` whenever the data has a server source of truth, even if it feels like "just a read." Reach for Zustand only when there is genuinely no server backing the value.

---

## State Shape

### Use a discriminated union for multi-step workflows that a store owns directly

```typescript
// domain/entities/order-workflow-state.ts
export type OrderWorkflowState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'submitted'; orderId: string }
  | { status: 'failed'; message: string };
```

### Use TanStack Query's own state for simple load/error/data screens

```typescript
const { data, isLoading, isError, error } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });
```

Do not duplicate TanStack Query's `data`/`isLoading`/`error` into a parallel Zustand store for the same resource — that's exactly the mirrored-state bug this split is designed to avoid.

---

## Repository Results Into Hook State

Repositories return `Result<T,E>`. The hook is the translation boundary.

For non-trivial flows, the hook is the translation boundary after the use-case, not after the repository directly.

```typescript
// examples/reference-features/auth/presentation/hooks/use-auth.ts (excerpt)
const loginMutation = useMutation({
  mutationFn: async ({ phone, password }: { phone: string; password: string }) => {
    setAuthState({ status: 'loading' });
    const { loginUseCase } = buildDependencies();
    const result = await loginUseCase.execute(phone, password);
    if (!result.ok) {
      setAuthState({ status: 'error', message: result.error.message });
      throw new Error(result.error.message);
    }
    return result.value;
  },
  onSuccess: (tokens) => {
    setAuthState({ status: 'authenticated', user: authTokensToUser(tokens) });
    setSessionAuthenticated({ userId: tokens.id, displayName: tokens.userName });
  },
});
```

Rules:
- No `try/catch` in components for repository/use-case calls
- No DOM refs or component instances stored in a Zustand store
- No raw `fetch`/`Response` objects outside the network layer
- No feature imports from another feature; promote shared state to `core/`
- Keep hooks thin and event-driven
- No multi-dependency orchestration in hooks when a use-case can hold it cleanly
- Hook return values should read like a UI-facing API (`login`, `isLoggingIn`), not a raw service locator

---

## Parameterized Queries

Use the query key to scope state by route params, ids, filters, or search strings.

```typescript
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: async () => unwrapOrThrow(await orderRepository.getOrder(orderId)),
    enabled: Boolean(orderId),
  });
}
```

Query key rules:
- Prefer primitive, stable values: `string`, `number`, `boolean`
- Feature name is always the first key segment (`['orders', ...]`) so `invalidateQueries({ queryKey: ['orders'] })` invalidates the whole feature
- Never put a function, class instance, or JSX element in a query key

---

## Mutations

Mutation methods live on the hook via `useMutation`. Optimistic updates only when rollback is clear.

```typescript
export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: CreateOrderRequest) => unwrapOrThrow(await orderRepository.createOrder(request)),
    onSuccess: (order) => {
      queryClient.setQueryData<Order[]>(['orders'], (previous) => [order, ...(previous ?? [])]);
    },
  });
}
```

For destructive mutations, prefer server-confirmed updates over optimistic ones:

```typescript
export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrapOrThrow(await orderRepository.deleteOrder(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}
```

If a mutation talks to more than one dependency or contains branching product rules, move that logic into a use-case and keep the hook focused on wiring it to TanStack Query.

---

## Cache, SWR, And Invalidation

TanStack Query already implements stale-while-revalidate — configure it via `staleTime`/`gcTime` instead of hand-rolling cache logic:

```typescript
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 60_000,  // treat data as fresh for 60s; background refetch after that on next mount/focus
  });
}
```

- Use a short/default `staleTime` for frequently-changing data.
- Use `staleTime: Infinity` for data that only changes via an explicit mutation you invalidate yourself (see `restoreQuery` in `use-auth.ts`).
- Invalidate the narrowest key that covers what changed (`['orders', orderId]` over `['orders']` when only one order changed).
- Invalidate session-scoped queries on logout — see `queryClient.clear()` in `use-auth.ts`'s `logoutMutation`.

---

## UI Consumption Rules

Components that read hooks must be Client Components.

```typescript
'use client';

export function OrdersScreen() {
  const { data, isLoading, error, refetch } = useOrders();

  if (isLoading) return <AppSkeleton />;
  if (error) return <AppErrorState onRetry={() => refetch()} />;
  return <OrdersList orders={data ?? []} />;
}
```

Rules:
- Read query/mutation state at the top of the component — never conditionally call a hook
- Use the mutation's returned `mutate`/`mutateAsync` inside event handlers, not during render
- Use `useEffect` only for genuine side effects outside the render/query lifecycle (rare) — not as a fetch trigger

---

## Anti-Patterns

| NEVER | ALWAYS |
|---|---|
| Fetch data with `useEffect` + `useState` | `useQuery` |
| Put API calls in components | Call repositories/use-cases from hooks |
| Store server data in Zustand | Store it in the TanStack Query cache; Zustand for client-only state |
| Duplicate `data`/`isLoading`/`error` into a parallel store | Read them straight from the query result |
| Use unstable objects as query keys | Primitive, stable key segments |
| Keep session-scoped query data cached after logout | `queryClient.clear()` or targeted `invalidateQueries` on logout |
| Call a hook conditionally | Call unconditionally at the top of the component |

---

## State Checklist

- [ ] Hooks live in the feature `presentation/hooks/` folder
- [ ] Repository/use-case instances are constructed with `getApiClient()`/`getTokenStorage()`, not hardcoded dependencies
- [ ] Hook converts `Result<T,E>` into thrown errors (`unwrapOrThrow`) or explicit branching for TanStack Query
- [ ] Component handles loading, data, and error states
- [ ] Query keys are stable and feature-scoped
- [ ] Mutations expose methods via the hook, not free functions
- [ ] Cache/staleness behavior is configured via `staleTime`/`gcTime`, not hand-rolled
- [ ] Auth-specific queries are invalidated/cleared on logout
- [ ] New state behavior has tests, following `skills/references/testing-expectations.md`
