<!--
  AI-AGNOSTIC SKILL — works with Claude, Cursor, Copilot, ChatGPT, Gemini, or any AI.
  Paste this file into your AI context when you have a bug to diagnose.

  name: nextjs-debugging
  description: Decision trees for every category of Next.js/React bug — hydration
               mismatches, re-render storms, stale query state, middleware redirect
               loops, Server/Client Component boundary errors, build errors.
  use-when: Something is broken and you need to find it fast. Distinct from testing
            (testing prevents bugs) — this finds them when they're already happening.
-->

# Next.js Debugging Skill

> Every bug has a category. Every category has a decision tree.
> Read the symptoms → find the category → follow the tree.

## When To Use

Use this skill when something is broken now and you need a diagnosis path, not a feature-building guide.

Related operating references:
- `skills/START_HERE.md`
- `skills/references/template-invariants.md`

## Stack Alignment

This template uses **TanStack Query** for server state, **Zustand** for client state, **Next.js App Router** for routing/middleware, and **`Result<T,E>`** for network outcomes. When debugging API failures, inspect both branches of `Result` and `core/network/api-client.ts`'s `onUnauthorized` behavior before changing UI code.

---

## Bug Category Index

| Symptom | Category |
|---|---|
| "Text content does not match server-rendered HTML" | → [Hydration Mismatches](#1-hydration-mismatches) |
| Component re-renders too often / janky UI / DevTools Profiler flags | → [Re-Render Storms](#2-re-render-storms) |
| Query returns stale data, doesn't refetch, or throws unexpectedly | → [TanStack Query Issues](#3-tanstack-query-issues) |
| Redirect loop, wrong page shown, middleware not firing | → [Middleware / Routing Issues](#4-middleware--routing-issues) |
| "You're importing a component that needs X. This React hook only works in a Client Component" | → [Server/Client Boundary Errors](#5-serverclient-boundary-errors) |
| Build fails after `npm install`/upgrade | → [Build Errors After Upgrade](#6-build-errors-after-upgrade) |
| Zustand store not updating, or updates don't reach the component | → [Zustand State Issues](#7-zustand-state-issues) |
| Network call fails / returns unexpected data | → [Network & API Issues](#8-network--api-issues) |
| Layout looks wrong on a specific viewport | → [Responsive Rendering Issues](#9-responsive-rendering-issues) |
| App gets slower over a session, memory grows | → [Memory Leaks](#10-memory-leaks) |

---

## 1. Hydration Mismatches

**Symptoms:** Console error "Text content does not match server-rendered HTML", or "Hydration failed because the initial UI does not match what was rendered on the server."

### Decision Tree

```
Does the mismatch involve a date, time, or random value?
  YES → Is the value computed during render (e.g. `new Date().toLocaleString()`)?
          YES → Server and client render at different times / in different locales.
                Fix: compute it in a useEffect and store in state (renders empty/loading
                on server, fills in on client), or pass a stable value from the server.
        NO  → Is a random ID (`Math.random()`, `crypto.randomUUID()`) used in render?
                YES → Use React's `useId()` instead — it's stable across server/client.

Does the mismatch involve `window`, `document`, `localStorage`, or `sessionStorage`?
  YES → These don't exist during SSR. Any render branch using them will differ.
        Fix: gate with `typeof window !== 'undefined'`, or move the read into
        `useEffect` and hold it in state, or mark the component `'use client'` and
        render a stable placeholder until mounted:

        const [mounted, setMounted] = useState(false);
        useEffect(() => setMounted(true), []);
        if (!mounted) return null; // or a skeleton

Does the mismatch involve a browser extension injecting attributes into <html>/<body>?
  → Not a real bug. Add `suppressHydrationWarning` to that element only
    (already set on <html> in app/layout.tsx for exactly this reason).

Does the mismatch only happen for authenticated users?
  → Server render likely assumed a guest/unknown session, client then reads a
    resolved session and renders differently.
    Fix: server-render the session-agnostic shell, resolve session state inside a
    Client Component after mount (see core/session/session-providers.ts —
    SessionState starts 'unknown' for exactly this reason).
```

---

## 2. Re-Render Storms

**Symptoms:** Janky typing in a form, visible flicker, React DevTools Profiler shows wide/frequent commits.

### Decision Tree

```
Is a Zustand-subscribed component re-rendering on unrelated state changes?
  → Are you selecting the whole store instead of one field?
      YES → const { a, b } = useStore();  ← re-renders on ANY field change
            Fix: const a = useStore((s) => s.a); (separate selector per field)
      NO  → Is the selector returning a new object/array every call?
              YES → useStore((s) => ({ a: s.a, b: s.b }))  ← new reference every render
                    Fix: select primitives individually, or use a shallow-equality
                    comparator (zustand/shallow) if a grouped object is required.

Is a TanStack Query-driven component re-rendering more than expected?
  → Are you destructuring the whole query result?
      Every field (isFetching, dataUpdatedAt, ...) changes independently and each
      triggers a re-render of anything reading the full object.
      Fix: select only what's needed:
      const data = useQuery({ queryKey, queryFn, select: (d) => d.items });

Does typing in a text input feel laggy?
  → Is the input's value driven by a parent that re-renders on every keystroke
    for an unrelated reason (e.g. a sibling subscribed to the same store slice)?
      → Isolate the input into its own component so only it re-renders.
  → Is a debounce/expensive computation running synchronously in the input's
    onChange rather than being debounced?
      → Debounce the expensive part (search query, validation network call).

Is a whole list re-rendering when one item changes?
  → Are list items missing a stable `key` (using array index for a reorderable
    list)?
      YES → Use a stable id as the key.
  → Are list item components not memoized and receiving new inline object/array
    props every render from the parent?
      YES → Wrap the item in React.memo, and make sure the parent passes stable
            references (useMemo/useCallback) for object/array/function props.
```

### DevTools Steps

```bash
# React DevTools → Profiler tab → record → interact → stop
# Look for: components that re-render with no visible prop change ("why did
# this render" checkbox), and wide/frequent commits.
```

---

## 3. TanStack Query Issues

**Symptoms:** Data doesn't refetch after a mutation, stale data shown, query throws an unhandled error, infinite refetch loop.

### Decision Tree

```
Data doesn't update after a mutation succeeds?
  → Did the mutation's onSuccess call queryClient.invalidateQueries with a key
    that actually matches the stale query's key?
      NO  → Add it: onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
      YES → Does the invalidated key exactly (or as a prefix) match the query's key?
              ['orders'] invalidates ['orders'] AND ['orders', id] (prefix match)
              ['orders', id] does NOT invalidate ['orders'] (not a prefix in that direction)

Query refetches in an infinite loop?
  → Is the queryKey array built with a new object/array/function reference
    every render? (e.g. queryKey: ['orders', { filter }] where `filter` is a
    new object literal each render)
      YES → Memoize the key's dynamic parts, or use only primitive values in it.
  → Is `queryFn` capturing a value from a dependency that changes identity
    every render without that value actually being in the queryKey?
      → Add it to the queryKey so TanStack Query tracks it correctly, or
        stabilize the value with useMemo.

Query never re-fetches even though the data is stale?
  → Check `staleTime` — a long staleTime intentionally suppresses refetch
    until it elapses. That's often correct; confirm intent before "fixing" it.
  → Is `enabled: false` set and never flipped to true?

Unhandled error from queryFn crashes the component instead of showing
AppErrorState?
  → Is the component reading `error` from the hook and branching on it, or
    letting it propagate?
      → useQuery does NOT throw into the render tree by default — check the
        component actually renders <AppErrorState> when `error` is truthy,
        per skills/build/nextjs-ui/SKILL.md.
  → Is queryFn using unwrapOrThrow correctly, or throwing a non-Error value?
      → Throw only Error instances; TanStack Query's `error` typing assumes it.

Mutation's loading state doesn't reflect in the button?
  → Reading `mutation.isLoading` (removed in v5) instead of `mutation.isPending`?
      → This template is on TanStack Query v5 — use `isPending`.
```

---

## 4. Middleware / Routing Issues

**Symptoms:** Redirect loop between `/` and `/login`, middleware doesn't run, wrong route group renders.

### Decision Tree

```
Is there a redirect loop?
  → Read core/router/route-guards.ts's redirectForSession — does it return
    non-null when session.status === 'unknown'? It must not; unknown session
    should always return null (mid-flight check) to avoid a loop against a
    'guest' default.
  → Check middleware.ts's session hint derivation — is the cookie check
    actually reflecting real auth state, or defaulting one way and looping
    against the registry's expectation for that path?
  → Add a temporary console.log of {pathname, access, session, redirectPath}
    inside middleware.ts — Next.js prints server console output in the
    terminal running `next dev`, not the browser console.

Middleware doesn't seem to run at all?
  → Check `config.matcher` in middleware.ts — does it exclude the path you're
    testing? The default excludes /api, /_next/static, /_next/image,
    favicon.ico.
  → Is middleware.ts actually at the repo root (not inside app/)? Next.js
    only picks it up from the root.

Wrong route group layout renders?
  → Route groups ((no-auth), (reference-auth)) don't affect the URL path —
    confirm the page actually lives under the group you think it does.
  → Two route groups defining the same path is a Next.js build-time
    conflict — check for a duplicate page.tsx across groups.

A Client Component hook (useRouter, useSearchParams) throws
"invariant expected app router to be mounted"?
  → The component is rendered outside the Next.js App Router tree, most
    commonly in a test. In tests, wrap with next/navigation's test utilities
    or mock the hook — see skills/quality/nextjs-testing/SKILL.md.
```

---

## 5. Server/Client Boundary Errors

**Symptoms:** "You're importing a component that needs `useState`. This React hook only works in a Client Component", or a server-only module (e.g. one reading `REMOTE_LOG_BEARER_TOKEN`) ends up in the client bundle.

### Decision Tree

```
"This React hook only works in a Client Component" error?
  → Is the file missing `'use client'` at the very top (before any imports)?
      YES → Add it.
  → Is a Server Component importing a Client Component and trying to use a
    hook itself, instead of just rendering the Client Component as a child?
      → Move the hook usage INTO the Client Component; the Server Component
        just renders <ClientComponent /> or passes serializable props to it.

A server-only env var (REMOTE_LOG_BEARER_TOKEN, no NEXT_PUBLIC_ prefix)
appears to leak, or reads as undefined unexpectedly on the server?
  → Confirm it's read only inside core/config/app-config.ts's getAppConfig(),
    never destructured from process.env directly elsewhere.
  → Confirm the reading code path only runs in a Server Component, Route
    Handler, or middleware — never inside a file marked 'use client'.
  → Next.js only inlines NEXT_PUBLIC_-prefixed vars into the client bundle;
    a missing server-only value read from a Client Component will silently
    be undefined, not throw — that's differentiating behavior worth logging.

Passing a non-serializable prop (a function, a class instance, a Date with
custom methods) from a Server Component to a Client Component fails or
warns?
  → Server → Client props must be serializable. Pass plain data; construct
    class instances (repositories, use-cases) INSIDE the Client Component /
    hook, not on the server and passed down.
```

---

## 6. Build Errors After Upgrade

**Symptoms:** Compilation errors after `npm install`/`npm update`, type errors, missing exports.

### Decision Tree

```
Step 1 — Clean everything first (most build errors are cache issues)
  rm -rf .next node_modules
  npm install

Step 2 — Read the error message
  "Type 'X' is not assignable to type 'Y'"
    → A dependency changed a type signature (React 18 → 19 is a common one).
    → Check the package's CHANGELOG for the version that introduced the change.
    → Fix the call site to the new signature.

  "Module not found: Can't resolve '@/...'"
    → Check tsconfig.json's `paths` still maps "@/*" to "./*".
    → Check the file actually exists at that path (case-sensitive on CI/Linux
      even if it built locally on macOS).

  "X is not exported from 'package'"
    → Import path changed in a major version bump — check the package's
      migration guide.

Step 3 — Isolate the breaking package
  git diff package-lock.json   ← shows exactly which versions changed
  npm ls <package>              ← check resolved version and who depends on it

Step 4 — Fix incrementally
  Fix one error at a time.
  Do not run another broad `npm update` until all errors are resolved.
  Commit after each package migration.
```

### Useful Commands

```bash
# See what changed in the lockfile
git diff package-lock.json

# Check for outdated packages without upgrading
npm outdated

# Type-check without emitting
npm run typecheck

# See why a package is at a certain version
npm ls <package-name>
```

---

## 7. Zustand State Issues

**Symptoms:** Store update doesn't reach a component, state resets unexpectedly, stale closure over store value.

### Decision Tree

```
Component doesn't re-render when the store updates?
  → Is the component calling the store hook with no selector, or with a
    selector returning a fresh object every call (breaks reference equality
    and Zustand's default shallow bail-out doesn't apply to plain object
    literals)?
      → Select the specific field: useStore((s) => s.field)

Store value read inside a callback is stale?
  → Was the value captured via the selector hook at render time, then used
    inside a setTimeout/async callback later?
      → Read the live value at call time instead: useStore.getState().field
        (Zustand's non-hook accessor), not the value closed over from render.

State unexpectedly resets on navigation?
  → Is the store created inside a component (module-scope `create()` should
    live in a dedicated file, not inside a component function — creating it
    inside a component makes a new store instance every render/mount)?
      → Move `create()` to module scope in presentation/stores/your-store.ts.

Two features seem to share state that should be independent?
  → Is a single store being imported and given divergent "current id"
    semantics by two features? That's a sign the store should be feature-
    scoped, not shared — see skills/build/nextjs-architecture/SKILL.md
    on cross-feature isolation.
```

---

## 8. Network & API Issues

**Symptoms:** API call fails, wrong data returned, auth header not sent, 401 in production only.

### Decision Tree

```
Request not reaching the server?
  → Log the resolved URL inside core/network/api-client.ts's request() method
    temporarily.
  → Check: NEXT_PUBLIC_API_BASE_URL set correctly for this environment?
  → Check: CORS — is the browser blocking the response before it reaches
    your code? (Look in the Network tab for a failed preflight, not just
    the Console.)

401 Unauthorized?
  → Is the Authorization header being set?
      Check the Network tab's request headers.
  → Is the token valid / not expired?
      Decode the JWT at jwt.io → check `exp`.
  → Production 401 but dev works?
      Check NEXT_PUBLIC_API_BASE_URL for the prod build.
      Check core/auth/token-storage-provider.ts — sessionStorage doesn't
      persist across tabs/windows by design; confirm that's expected, not
      a bug being chased.

Response body not parsing correctly?
  → Log the raw response inside toApiError()/the success branch temporarily.
  → Compare the JSON shape to your DTO's fields — a mismatched field name
    silently produces `undefined`, not an error, in TypeScript without
    runtime validation.
  → Confirm core/network/error-envelope.ts's field-name mapping actually
    matches this backend's error shape — it's configurable, not hardcoded
    to one convention (e.g. not assumed RFC 7807 by default).

CORS error only in the browser, works via curl?
  → The backend needs to allow the exact origin + credentials: 'include'
    combination the client sends. Not fixable from the frontend alone.
```

---

## 9. Responsive Rendering Issues

**Symptoms:** Layout breaks at a specific viewport, overflow, content clipped.

### Decision Tree

```
Horizontal overflow at narrow viewports?
  → Look for a fixed width class (w-[400px]) with no responsive variant.
  → Fix: use max-w-full, flex-wrap, or a responsive width (w-full md:w-96).

Content clipped at 200% browser zoom / large OS font size?
  → Look for a fixed height container (h-10) wrapping text that should wrap.
  → Fix: use min-h-* instead of h-* for text-containing containers.

Layout looks fine in Chrome but breaks in Safari?
  → Check for a CSS feature without a fallback (e.g. a very new flex/grid
    gap behavior). Test the specific property in caniuse.
```

---

## 10. Memory Leaks

**Symptoms:** App gets slower over a session, DevTools Memory tab shows growth that doesn't return after GC.

### Decision Tree

```
Open DevTools → Memory tab → take snapshot → navigate around → take another
snapshot → sort by "Retained Size" → look for growing counts of your
component/class instances.

Event listener or WebSocket not cleaned up?
  → Check every useEffect that adds a listener/opens a connection has a
    matching cleanup function that removes/closes it. See
    skills/build/nextjs-realtime/SKILL.md for the WebSocket pattern.

Interval/timeout not cleared?
  → setInterval/setTimeout stored without a cleared reference in the
    effect's cleanup function.

Zustand or TanStack Query cache growing unbounded?
  → Query cache: check `gcTime` isn't set unreasonably high for a
    high-cardinality query key (e.g. keyed by a constantly-changing search
    string with no upper bound).
  → Zustand: check a store isn't accumulating an ever-growing array/map
    with no eviction (e.g. a live-updates feed with no cap).
```

---

## Debugging Checklist

Before asking for help or filing a bug:

- [ ] Read the FULL error message and stack trace — not just the first line
- [ ] Identified the category above and followed the decision tree
- [ ] Tried `rm -rf .next node_modules && npm install`?
- [ ] Checked both the browser console AND the terminal running `next dev` (server-side logs only show in the terminal)?
- [ ] Checked the Network tab for the actual request/response, not just the Console?
- [ ] Used React DevTools Profiler for re-render issues?
- [ ] Checked `git diff package-lock.json` for build issues after upgrade?
