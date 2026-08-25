<!--
  AI-AGNOSTIC SKILL — works with Claude, Cursor, Copilot, ChatGPT, Gemini, or any AI.
  Paste this file into your AI context when doing runtime/hosting configuration.

  name: nextjs-platform
  description: Edge vs Node runtime selection, middleware constraints, hosting-provider
               specifics, and the platform-layer config that breaks deploys in
               unexpected ways.
  use-when: Choosing a runtime for a route, configuring middleware, deploying to a
            specific host, or debugging a platform-only build/runtime failure.
-->

# Next.js Platform Skill

> The runtime/hosting layer. App code ends here. This is what breaks deploys in unexpected ways.

## When To Use

Use this skill when the task touches `next.config.js`, a route's `runtime` export, `middleware.ts`'s constraints, or hosting-provider-specific configuration.

Related operating references:
- `skills/START_HERE.md`
- `skills/references/definition-of-done.md`

---

## Edge vs Node Runtime

Next.js App Router lets each Route Handler and Server Component choose a runtime. This template's `app/api/health/route.ts` runs on the default Node runtime; know when you'd choose differently.

```typescript
// app/api/some-route/route.ts
export const runtime = 'nodejs'; // default — full Node API surface
// or
export const runtime = 'edge';  // smaller, faster cold start, restricted API surface
```

| Need | Runtime |
|---|---|
| File system access, most npm packages, long-running work | `nodejs` (default) |
| Low-latency, geographically distributed simple logic (auth checks, redirects, A/B bucketing) | `edge` |
| Access to `REMOTE_LOG_BEARER_TOKEN` or other server-only secrets via a full Node client library | `nodejs` |
| Streaming responses with minimal cold-start latency | `edge` (if the work fits Edge's API subset) |

`middleware.ts` **always** runs on the Edge runtime — this is a Next.js constraint, not a template choice. That's why `core/router/route-guards.ts` is kept pure (`SessionState` in, redirect path out) with zero Node-only APIs: it has to work under Edge's restricted runtime.

Edge runtime restrictions to know:
- No Node `fs`, `net`, `child_process`, or most native addons
- No arbitrary npm package — many packages assume Node APIs and will fail to bundle for Edge
- `fetch` is available; most other Node globals are not
- Smaller max execution time depending on host

---

## Middleware Constraints

`middleware.ts` at the repo root:

```typescript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

Rules:
- Keep middleware logic minimal and fast — it runs on every matched request, on Edge, before any page renders.
- Never do a real database/backend authorization check inside middleware — it's a coarse UX gate (see `skills/references/auth-guarded-route.md`). A slow middleware call adds latency to every single navigation.
- If middleware needs to call an API, it must be a fast, Edge-compatible `fetch` call — no heavy SDKs.
- Adjust `matcher` carefully — an overly broad matcher slows every request; an overly narrow one lets protected routes slip through unguarded.

---

## Environment Variables Across Runtimes

`core/config/app-config.ts` is the only place env vars are read. Know which values are available where:

| Var prefix | Available in | Notes |
|---|---|---|
| `NEXT_PUBLIC_*` | Browser, Server Components, Route Handlers, Middleware | Inlined into the client bundle at build time — never put a secret behind this prefix |
| No prefix (e.g. `REMOTE_LOG_BEARER_TOKEN`) | Server Components, Route Handlers (Node runtime only) | Undefined in the browser and in Edge middleware unless explicitly wired through |

If a feature needs a server-only secret inside `middleware.ts`, that's a sign the check belongs in a Route Handler the middleware calls via `fetch`, not inlined into Edge-run code directly.

---

## Hosting Provider Notes

This template is hosting-agnostic by design (`next build` output works on Vercel, a Node server, or any Next.js-compatible platform). Know the differences that matter:

| Concern | Vercel | Self-hosted Node server |
|---|---|---|
| Edge runtime support | Native | Requires a compatible edge runtime (e.g. via a proxy) or falls back to Node |
| `middleware.ts` execution | Edge, globally distributed | Runs in your Node process unless you've set up an edge layer |
| Env var injection | Project dashboard / `vercel env` | Your process manager / container env, or `.env.local` for local dev only |
| Build output | `.vercel/output` (managed) | `next build` + `next start`, or a custom server |
| Static asset CDN | Automatic | You configure it (or serve from `next start`, which is slower) |

Regardless of host:
- Never commit `.env.local` — only `.env.example` is checked in.
- Confirm `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_URL` point at the correct environment's backend before deploying — a copy-pasted `.env` from staging into production is the most common platform-layer incident.
- Run `npm run build` locally before trusting a deploy — a build that fails only on the host wastes a deploy cycle discovering what a local build would have caught immediately.

---

## Common Platform Build Errors

```
"Dynamic server usage: ... couldn't be rendered statically because it used `cookies`/`headers`"
  → A page/Route Handler that reads request-specific data (cookies, headers) was
    expected to be static. This is often fine (Next.js falls back to dynamic
    rendering for that route) — but if static generation was intended, move the
    dynamic read into a narrower Client Component or Route Handler.

"Module not found" only in the deployed build, not locally
  → Case-sensitivity: most hosts build on Linux, which is case-sensitive for
    imports; macOS/Windows local dev is not. Check exact file name casing.

"Edge runtime does not support Node.js 'X' module"
  → A route/middleware marked (or defaulted to, for middleware.ts) 'edge' is
    importing a Node-only package. Either switch that route's runtime to
    'nodejs' (not possible for middleware.ts itself) or find an Edge-compatible
    alternative.

Build succeeds, but NEXT_PUBLIC_* values are stale/wrong in production
  → NEXT_PUBLIC_* vars are baked in at BUILD time, not read at runtime. Changing
    them on the host after a build requires a rebuild, not just a restart.
```

---

## Platform Checklist

Before shipping a change that touches runtime/hosting config:

- [ ] Route Handler `runtime` export is deliberate (`nodejs` default, `edge` only when the API surface allows it)
- [ ] `middleware.ts` logic stays fast and Edge-compatible — no heavy SDKs, no slow backend calls
- [ ] No server-only secret is referenced from a file that could execute in Edge middleware or the client bundle
- [ ] `.env.local` is not committed; `.env.example` is up to date with every var `app-config.ts` reads
- [ ] `NEXT_PUBLIC_API_BASE_URL`/`NEXT_PUBLIC_WS_URL` verified for the target environment before deploy
- [ ] `npm run build` passes locally before deploying
- [ ] Confirmed whether the host needs a rebuild (not just a restart) after an env var change
