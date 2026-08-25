<!--
  AI-AGNOSTIC SKILL — works with Claude, Cursor, Copilot, ChatGPT, Gemini, or any AI.
  Paste this file into your AI context and say: "Run a code review on this file."

  name: nextjs-code-review
  description: The quality gate. Runs after every other skill. Catches micro-issues
               that architecture docs and tests miss — missing 'use client', unhandled
               query error states, unstable dependencies, magic numbers.
  use-when: Reviewing any Next.js/TypeScript file, PR, AI-generated code, or finished
            feature. Run this LAST — after building, before merging.
-->

# Next.js Code Review Skill

> The quality gate. Runs on every file, every PR, every AI output.
> 50 checks. Pass/fail per item. 30 seconds per file.

## When To Use

Run this skill last after the implementation skill for the area and after checking `skills/references/definition-of-done.md`.

Shared invariants:
- `skills/references/template-invariants.md`
- `skills/references/definition-of-done.md`
- `skills/references/clean-code-doctrine.md`

---

## How to Use

Tell the AI:
```
Review this file using the nextjs-code-review skill.
Give me a pass/fail for each category and list every failure with file:line and the fix.
```

Or for a full PR:
```
Review all changed files using the nextjs-code-review skill.
Output: summary table of failures, then per-file details.
```

---

## CATEGORY 1 — Safety & Correctness

These are bugs, not style issues.

| # | Check | ❌ Fail | ✅ Pass |
|---|---|---|---|
| 1 | `'use client'` present on any file using hooks/browser APIs | Hook used, no directive | `'use client'` at top of file |
| 2 | Effect cleanup for every subscription/timer/socket | `useEffect(() => { sub() })` — no return | `useEffect(() => { const s = sub(); return () => s.cancel(); })` |
| 3 | No stale closures over state in async callbacks | `setTimeout(() => setCount(count + 1))` | Functional update: `setCount((c) => c + 1)` |
| 4 | No unguarded `window`/`document`/`localStorage` access at module or render top-level | `const w = window.innerWidth` in render body | Guard with `typeof window !== 'undefined'` or move into `useEffect` |
| 5 | No `any` types | `const data: any = ...` | Explicit interface, or `unknown` + narrowing |
| 6 | No non-null assertion (`!`) without a preceding guaranteeing check | `user!.name` | `if (!user) return null; user.name` |
| 7 | Every `useQuery`/`useMutation` error state is rendered | `.data` used, `.error` ignored | `if (error) return <AppErrorState .../>` |
| 8 | No double-submit on forms | `onSubmit` with no pending-state guard | `disabled={isPending}` on the submit control |
| 9 | Query/mutation keys use only primitive/stable values | `queryKey: ['orders', filterObjectLiteral]` | Primitive values, or a stably-memoized object |
| 10 | Async event handlers awaited, not fire-and-forget without an error path | `onClick={() => doAsync()}` swallows rejection | `onClick={() => { void doAsync().catch(handleError); }}` or `async () => await` |

---

## CATEGORY 2 — TanStack Query / Zustand Rules

| # | Check | ❌ Fail | ✅ Pass |
|---|---|---|---|
| 11 | No server data stored in Zustand | `useStore((s) => s.orders)` holding fetched data | Server data lives in the TanStack Query cache |
| 12 | No parallel state duplicating a query's `data`/`isLoading`/`error` | `useEffect(() => setLocal(data), [data])` | Read directly from the query result |
| 13 | Zustand selectors select primitives, not fresh object literals | `useStore((s) => ({ a: s.a, b: s.b }))` | Separate selector per field, or `useShallow` |
| 14 | `isPending` used for TanStack Query v5 mutations, not `isLoading` | `mutation.isLoading` | `mutation.isPending` |
| 15 | Mutation `onSuccess` invalidates/updates the right query key | No invalidation after a write | `queryClient.invalidateQueries({ queryKey: [...] })` |
| 16 | No hook called conditionally | `if (x) { useQuery(...) }` | Called unconditionally; use `enabled` to gate |
| 17 | Session-scoped queries cleared/invalidated on logout | Stale authenticated data survives logout | `queryClient.clear()` or targeted invalidation in the logout flow |

---

## CATEGORY 3 — Performance

| # | Check | ❌ Fail | ✅ Pass |
|---|---|---|---|
| 18 | List items have a stable `key`, not array index for reorderable lists | `key={index}` | `key={item.id}` |
| 19 | Expensive computation not run unmemoized in every render | Sort/filter recomputed inline on every render of a large list | `useMemo` for genuinely expensive derivations |
| 20 | No inline function/object literal passed to a memoized child every render | `<Memoized onClick={() => x()} />` defeats memoization | `useCallback`, or accept the re-render if the child is cheap |
| 21 | `next/image` used for meaningful images, not raw `<img>` | `<img src="/hero.png" />` | `<Image src="/hero.png" ... />` |
| 22 | No unbounded list rendered without pagination/virtualization | `.map()` over a potentially-thousands-long array | Paginate server-side, or virtualize |
| 23 | `'use client'` boundary is as low in the tree as reasonable | Whole page marked client for one button | Isolated interactive leaf component |

---

## CATEGORY 4 — Navigation

| # | Check | ❌ Fail | ✅ Pass |
|---|---|---|---|
| 24 | No imperative auth redirect from a component | `useEffect(() => { if (!session) router.push('/login') })` | `middleware.ts` + `core/router/route-guards.ts` |
| 25 | Internal navigation uses `<Link>`/`useRouter()`, not full page reload | `<a href="/orders">` for an internal route | `<Link href="/orders">` |
| 26 | Route access declared in `route-registry.ts`, not inline path checks scattered in components | `if (pathname.startsWith('/admin'))` in a component | Registry entry + middleware |

---

## CATEGORY 5 — Design System Compliance

| # | Check | ❌ Fail | ✅ Pass |
|---|---|---|---|
| 27 | No hardcoded hex colors in components | `className="text-[#1B3A5C]"` | `className="text-primary"` |
| 28 | No arbitrary px spacing where a token exists | `className="p-[13px]"` | `className="p-4"` |
| 29 | No hardcoded `border-radius` values | `style={{ borderRadius: 12 }}` | `className="rounded-md"` (backed by `--radius-md`) |
| 30 | Design-system primitives used over raw elements | Hand-rolled `<button className="...">` | `<Button variant="...">` |
| 31 | Loading/empty/error states use the shared components | Bare `<svg className="animate-spin">` | `AppSkeleton` / `AppEmptyState` / `AppErrorState` |

---

## CATEGORY 6 — Code Quality

| # | Check | ❌ Fail | ✅ Pass |
|---|---|---|---|
| 32 | No empty `catch` blocks | `catch (e) {}` | `catch (e) { logger.error(...); }` or handle explicitly |
| 33 | No `console.log` left in committed code | `console.log('debug', x)` | `getAppLogger()` (respects `NEXT_PUBLIC_LOG_LEVEL`) |
| 34 | No hardcoded user-facing strings scattered across components | `<p>Something went wrong</p>` inline everywhere | `core/strings/app-strings.ts` |
| 35 | DTO parsing has defensive typing | `const id = json.id as string` — crashes if shape changes | Zod schema or explicit optional handling |
| 36 | No business logic in component files | API/orchestration logic directly in a `.tsx` component | Logic in hook/use-case, component renders |
| 37 | Feature files don't import from other features | `import { X } from '@/features/orders/...'` inside `features/products/` | Shared state through `core/` |
| 38 | No `dynamic` untyped values crossing a function boundary | Untyped `response.data` passed onward | Explicit interface or generic type param |
| 39 | No god components or giant JSX trees | One component owns header, form, list, and modal inline | Split into section/state components |
| 40 | Names are intention-revealing | `handleThing`, `data`, `value` | `submitLogin`, `selectedOrderId`, `authState` |
| 41 | Comments are not compensating for unclear code | Comment explains an obvious line | Better naming/extraction, minimal intent comments |
| 42 | Non-trivial business flow extracted from the hook | Hook saves tokens, branches roles, updates cache inline | Verb-named use-case owns orchestration |
| 43 | No unused locals/parameters (enforced by `tsconfig.json`) | Unused destructured variable | Remove it or prefix with `_` only where the compiler allows |

---

## CATEGORY 7 — Architecture Compliance

| # | Check | ❌ Fail | ✅ Pass |
|---|---|---|---|
| 44 | Repository/use-case returns `Result<T,E>` — not a raw value or thrown exception | `async getOrder(): Promise<Order>` throws on error | `Promise<Result<Order, ApiError>>` |
| 45 | Tokens never stored outside `token-storage-provider.ts` | `clientCache.set('token', jwt)` | `tokenStorage.saveTokens(...)` |
| 46 | `ApiClient` not constructed ad hoc in feature code | `new ApiClient()` scattered across files | `getApiClient()` shared instance, or explicit DI at the composition point |
| 47 | State types are discriminated unions with a `status`/kind field | `interface OrderState { orders?: Order[]; error?: string }` (ambiguous) | `type OrderState = { status: 'loaded'; orders: Order[] } | ...` |
| 48 | Server Component files contain no hooks | `useState` inside a file with no `'use client'` | Move state into a Client Component |
| 49 | Env vars read only via `core/config/app-config.ts` | `process.env.NEXT_PUBLIC_API_BASE_URL` inline elsewhere | `getAppConfig().apiBaseUrl` |
| 50 | Server-only env vars never referenced from a `'use client'` file | `REMOTE_LOG_BEARER_TOKEN` read in a client component | Server-only values stay in Server Components/Route Handlers |

---

## Review Output Format

When an AI runs this review, ask for output in this format:

```
## Code Review — [filename]

### Summary
| Category | Checks | Passed | Failed |
|---|---|---|---|
| Safety & Correctness | 10 | 9 | 1 |
| TanStack Query / Zustand | 7 | 7 | 0 |
| Performance | 6 | 5 | 1 |
| Navigation | 3 | 3 | 0 |
| Design System | 5 | 3 | 2 |
| Code Quality | 12 | 12 | 0 |
| Architecture | 7 | 7 | 0 |
| **TOTAL** | **50** | **46** | **4** |

### Failures

**[SAFETY #7]** Query error state not rendered
  File: features/products/presentation/components/products-view.tsx:14
  Found:   `const { data } = useProducts();`
  Fix:     `const { data, error } = useProducts(); if (error) return <AppErrorState .../>;`

**[DESIGN SYSTEM #27]** Hardcoded hex color
  File: features/products/presentation/components/product-tile.tsx:9
  Found:   `className="text-[#1B3A5C]"`
  Fix:     `className="text-primary"`

...

### Passed
All checks in: TanStack Query / Zustand, Navigation, Code Quality, Architecture
```

---

## Quick Single-File Review Prompt

Copy-paste this to any AI with the file content:

```
You are a Next.js/TypeScript code reviewer. Apply the nextjs-code-review skill (50
checks across 7 categories). For every failure, give: category, check number,
file:line, what was found, and the exact fix. At the end, give a summary table.
Be exhaustive — do not skip checks.
```

---

## CI Integration

Run the existing audit script for automated checks (subset of this skill):

```bash
# Catches checks: 27, 28, 29 (design system), 31 (loading states)
python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red

# Full report
python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --all
```

The remaining checks (safety, architecture, TanStack Query/Zustand correctness) require AI review — the static script cannot infer intent.
