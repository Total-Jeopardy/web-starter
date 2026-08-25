# State Patterns Reference

Pick the smallest correct combination of TanStack Query and Zustand for this template.

## Use TanStack Query (`useQuery` / `useMutation`)

For anything that originates from the server — this is the default:

```typescript
const ordersQuery = useQuery({
  queryKey: ['orders'],
  queryFn: async () => {
    const result = await orderRepository.getOrders();
    return unwrapOrThrow(result);
  },
});
```

Use for:
- screen loads / list and detail reads
- paginated or remote-backed lists
- mutations (create/update/delete) via `useMutation`, followed by
  `queryClient.invalidateQueries` on success

## Use Zustand (`create`)

For state that is client-only and does not originate from the server:

```typescript
export const useFilterStore = create<FilterStore>((set) => ({
  status: 'all',
  setStatus: (status) => set({ status }),
}));
```

Use for:
- form-in-progress state, filters, selected tab
- auth/session UI flags (loading/error) — never tokens (see `token-storage-provider.ts`)
- multi-step wizard state

## Query Keys

- Prefer array keys scoped by feature: `['orders']`, `['orders', orderId]`.
- Keep the feature name as the first key segment so `queryClient.invalidateQueries({ queryKey: ['orders'] })` invalidates the whole feature cleanly.
- Never put unstable objects (JSX, functions, class instances) in a query key — only primitives or plain serializable values.

## Translating `Result<T,E>` Into Query State

Repositories/use-cases return `Result<T,E>`. The hook is the translation boundary — `unwrapOrThrow` converts a `Result` failure into a thrown error at the exact point TanStack Query expects one:

```typescript
import { unwrapOrThrow } from '@/core/network/api-result';

const { data, isLoading, error } = useQuery({
  queryKey: ['orders', orderId],
  queryFn: async () => unwrapOrThrow(await orderRepository.getOrder(orderId)),
});
```

Rules:
- no `try/catch` in components for query/mutation errors — read `error` from the hook result
- no `useState` + `useEffect` fetch-on-mount patterns — that's what `useQuery` is for
- no feature imports from another feature; promote shared state to `core/`
- keep hooks thin; move multi-dependency orchestration into `domain/use-cases/`
- invalidate session-scoped queries on logout (see `examples/reference-features/auth/presentation/hooks/use-auth.ts`)
