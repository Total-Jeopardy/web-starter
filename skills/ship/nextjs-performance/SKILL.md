# Next.js Performance Skill

> Bundle size, re-render control, list rendering, caching, and Core Web Vitals discipline for this Next.js starter template.

---

## Stack Alignment

This template uses:
- Next.js 14 App Router with an explicit Server/Client Component split
- TanStack Query v5 for server-state caching
- Zustand v4 for client-only state
- Tailwind CSS v3 + hand-authored `core/design-system/ui/` primitives
- `core/network/api-client.ts` for all network calls

Use this skill when improving load time, scroll smoothness, re-render count, network/cache behavior, or Core Web Vitals (LCP, CLS, INP).

## When To Use

Read this skill for performance-sensitive UI, cached read behavior, or any state that should feel instant without violating template invariants.

---

## Performance Workflow

Do not optimize by instinct. Follow this order:

1. Reproduce the slow path.
2. Identify whether it's bundle size, render, network, or layout shift.
3. Measure with React DevTools Profiler, Chrome Performance panel, or `next build`'s output.
4. Make the smallest targeted change.
5. Re-run the same path.

Common targets:

| Symptom | First place to inspect |
|---|---|
| Slow first load | `app/layout.tsx`/`app/providers.tsx` client bundle size, unnecessary `'use client'` |
| Janky scroll | list item render cost, images, layout thrash |
| Spinner every revisit | `staleTime` too low, missing query cache reuse |
| Too many re-renders | broad Zustand selectors, unmemoized query `select`, unstable props |
| Repeated API calls | duplicate `useQuery` keys, missing `staleTime` |
| Layout shift (CLS) | images/skeletons without reserved dimensions |

---

## Bundle Size And The Server/Client Boundary

The single biggest performance lever in this template is keeping the client bundle small by defaulting to Server Components.

```typescript
// Server Component — ships zero JS for this subtree
export default function StarterHomePage() {
  return <main>...</main>;
}

// Client Component — ships its JS + everything it imports
'use client';
export function InteractiveWidget() { ... }
```

Rules:
- Push `'use client'` as far down the tree as possible — do not mark a whole page client just because one button needs an `onClick`.
- Check `next build`'s output for unexpectedly large client chunks; a Server Component accidentally importing a heavy client-only library pulls it into the bundle.
- Avoid importing an entire icon library's barrel export — `lucide-react`'s named imports are already tree-shakeable; don't wrap them in a re-export that defeats that.

---

## Rebuild/Re-Render Control

Keep Zustand selectors narrow.

```typescript
// Re-renders on ANY store field change
const { a, b } = useStore();

// Re-renders only when `a` changes
const a = useStore((s) => s.a);
```

For TanStack Query, use `select` to derive only what's needed:

```typescript
const productNames = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  select: (products) => products.map((p) => p.name),
});
```

Rules:
- Split large pages into small components with stable props.
- Avoid inline object/array/function literals passed as props to a memoized child — they defeat `React.memo`.
- Avoid expensive synchronous computation (sort/filter/format) directly in render for large datasets — wrap in `useMemo`.

---

## Perceived Speed With TanStack Query

Avoid flashing a full-page skeleton when data already exists in cache from a previous visit.

```typescript
const { data, isLoading, isFetching } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 60_000,
});

if (isLoading) return <AppSkeleton />;         // only true on a genuinely empty cache
// isFetching (without isLoading) means a background refresh — show existing data,
// optionally a small inline indicator, never blank the screen
return <ProductsList products={data} isRefreshing={isFetching} />;
```

`staleTime` is the primary lever: a longer `staleTime` means fewer background refetches and fewer perceived loading flickers, at the cost of potentially staler data. Tune per resource, not globally.

---

## Cache And Invalidation

Cache rules:
- Cache lives in the TanStack Query cache (in-memory) for server data — do not duplicate it into `client-cache.ts`.
- Invalidate the narrowest key that covers what changed.
- Do not cache secrets in `client-cache.ts`.
- Clear session-scoped query data on logout (`queryClient.clear()` — see `use-auth.ts`'s `logoutMutation`).

```typescript
queryClient.invalidateQueries({ queryKey: ['orders', orderId] }); // narrow
// vs
queryClient.invalidateQueries({ queryKey: ['orders'] });          // broad — use when the list itself changed
```

---

## Lists And Scrolling

```typescript
{products.map((product) => (
  <ProductTile key={product.id} product={product} />
))}
```

Rules:
- Always use a stable, unique `key` (never array index for a reorderable/mutable list).
- Paginate or virtualize before a list grows past a few hundred rows — a plain `.map()` over an unbounded array is the most common perf regression in this stack.
- Keep row components small and, where the parent re-renders often, wrapped in `React.memo` with stable props.
- Avoid nested scroll containers with unconstrained heights.

---

## Images

```typescript
import Image from 'next/image';

<Image src="/hero.png" alt="Product hero" width={800} height={450} priority />
```

Rules:
- Use `next/image`, not a raw `<img>`, for any meaningful content image — it handles responsive sizing, lazy loading, and format negotiation.
- Always set `width`/`height` (or use `fill` with a sized parent) to avoid layout shift (CLS).
- Use `priority` only for the actual largest-contentful-paint image above the fold — overusing it defeats lazy loading elsewhere.
- Reserve space for images that load asynchronously; a `Skeleton` placeholder at the final image's aspect ratio prevents shift.

---

## Network Performance

Use the existing `core/network/api-client.ts`; do not create parallel fetch wrappers.

Rules:
- Avoid duplicate fetches from multiple components for the same resource — TanStack Query already dedupes concurrent calls to the same query key; verify the key actually matches instead of hand-rolling dedup.
- Debounce search input before hitting the network.
- Cancel stale requests for route-scoped search/detail flows using `AbortSignal` (`options.signal` on `ApiClient` methods) — TanStack Query passes its own abort signal to `queryFn` automatically when the query is invalidated mid-flight.

```typescript
export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: ({ signal }) => searchRepository.search(query, { signal }),
    enabled: query.length > 0,
  });
}
```

Debounce at the input boundary (`useDeferredValue` or a small custom debounce hook) — never fire a request on every raw keystroke.

---

## Core Web Vitals

| Metric | What affects it here | Fix |
|---|---|---|
| LCP (Largest Contentful Paint) | Above-the-fold image/text render time | Server-render the shell, `priority` on the hero image, minimize client-bundle-blocking JS |
| CLS (Cumulative Layout Shift) | Images/skeletons without reserved dimensions, late-loading fonts | Explicit `width`/`height` on images, `AppSkeleton` sized to match loaded content |
| INP (Interaction to Next Paint) | Heavy synchronous work in event handlers, large client bundles blocking hydration | Debounce expensive handlers, keep `'use client'` scope small, memoize expensive derivations |

---

## Anti-Patterns

| NEVER | ALWAYS |
|---|---|
| Optimize without measuring | Reproduce, inspect, then change |
| Fetch data outside `useQuery`/`useMutation` | Load through TanStack Query hooks |
| Select a whole Zustand store when one field is needed | Narrow selector per field |
| Show a full-screen skeleton over cached data | Use `staleTime` + background refetch, keep existing data visible |
| Render an unbounded list with `.map()` | Paginate or virtualize |
| Use raw `<img>` for content images | `next/image` with explicit dimensions |
| Mark a whole page `'use client'` for one interactive element | Isolate the interactive leaf component |
| Create a second fetch wrapper for "speed" | Fix the query/cache configuration instead |

---

## Performance Checklist

- [ ] Slow path reproduced before changes
- [ ] React DevTools Profiler or Chrome Performance panel identifies the bottleneck category
- [ ] No data fetching happens outside `useQuery`/`useMutation`
- [ ] Long lists are paginated or virtualized
- [ ] Broad Zustand selectors are narrowed to single fields
- [ ] Cached data avoids unnecessary skeleton flashes (`staleTime` tuned)
- [ ] Session-scoped query data clears/invalidates on logout
- [ ] Content images use `next/image` with explicit dimensions
- [ ] `'use client'` boundary is as small as reasonable
- [ ] The same path is rechecked after the change
