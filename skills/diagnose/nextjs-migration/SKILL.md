# Next.js Migration Skill

> Upgrading Next.js, React, TanStack Query, Zustand, or any other dependency without breaking the architecture doctrine.

## When To Use

Use this skill when planning or executing a major-version upgrade of Next.js, React, TanStack Query, Zustand, Zod, Tailwind, or TypeScript itself.

Related:
- `skills/build/nextjs-backend/SKILL.md` for networking-layer changes
- `skills/build/nextjs-state/SKILL.md` for TanStack Query / Zustand changes
- `skills/ship/nextjs-devops/SKILL.md` before changing CI

---

## General Upgrade Procedure

```
Step 1 — Read the migration guide first, not the changelog diff
  Next.js:        https://nextjs.org/docs/app/building-your-application/upgrading
  React:           https://react.dev/blog (major version release notes)
  TanStack Query:  package's MIGRATION.md on GitHub
  Zustand:         package's CHANGELOG.md — v4→v5 changed the `create` import shape

Step 2 — Upgrade one package at a time, not everything at once
  npm install next@latest
  npm run typecheck && npm run test
  git commit

  npm install react@latest react-dom@latest
  npm run typecheck && npm run test
  git commit

  (repeat per package)

Step 3 — After every individual upgrade, run the full gate
  npm run typecheck
  npm run lint
  npm run test
  python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red

Step 4 — Re-check the architecture invariants weren't silently broken
  python skills/scripts/validate_skills.py
  Re-read skills/references/template-invariants.md against the diff.
```

---

## Next.js App Router Upgrades

```
Check the "Breaking Changes" section of the target version's upgrade guide for:
  - Changes to middleware.ts's supported APIs (matcher config, NextRequest shape)
  - Changes to Route Handler (app/api/*/route.ts) signatures
  - Changes to how Server/Client Component boundaries are enforced or inferred
  - Changes to next.config.js options (renamed/removed experimental flags)

After upgrading, specifically re-verify:
  - middleware.ts still compiles and its config.matcher still excludes the
    right paths (see skills/references/auth-guarded-route.md)
  - app/layout.tsx and app/providers.tsx's Server/Client split still builds
    without a "hook in Server Component" error
  - app/api/health/route.ts's Route Handler signature still matches the
    current app router convention
```

---

## React Major-Version Upgrades

```
Check for:
  - Removed/deprecated APIs used anywhere in core/design-system/ui/ (these
    are hand-authored, not vendored, so they don't get an upstream fix —
    you own the migration)
  - Changes to how refs/forwardRef work (core/design-system/ui/button.tsx
    uses React.forwardRef — check whether the new version still needs it
    or has a replacement pattern)
  - Changes to concurrent rendering behavior that could surface latent
    re-render bugs — re-run skills/diagnose/nextjs-debugging/SKILL.md's
    Re-Render Storms tree if anything looks different after upgrading
```

---

## TanStack Query Major-Version Upgrades

```
Check the package's MIGRATION.md for renamed fields — the v4→v5 upgrade
alone renamed `isLoading` → `isPending` on mutations, changed the object-only
call signature, and changed `cacheTime` → `gcTime`. Expect similarly-shaped
renames on future majors.

After upgrading:
  - grep the codebase for every `useQuery(`/`useMutation(` call site and
    confirm the call signature (object form) still matches
  - grep for `.isLoading` on mutation results specifically (query results
    keep isLoading in v5, but this has moved before and could again)
  - re-check app/providers.tsx's QueryClient defaultOptions keys are still
    valid names
  - re-run every hook test in test/features/*/presentation/hooks/
```

---

## Zustand Major-Version Upgrades

```
Check for:
  - Changes to the `create` import/call shape (v3→v4 changed curried usage
    for TypeScript; a future major could change again)
  - Changes to the shallow-equality helper's import path
    (zustand/shallow has moved before)
  - Confirm every store in presentation/stores/ and core/session/ still
    type-checks and its selector-based reads still work as expected
    (see skills/diagnose/nextjs-debugging/SKILL.md's Zustand section for
    what "still works" looks like)
```

---

## Zod / TypeScript Upgrades

```
Zod major upgrades: re-check core/config/app-config.ts's schema still
parses correctly — this is the one file that MUST keep working, since
every environment variable in the app funnels through it.

TypeScript upgrades: this template runs with noUncheckedIndexedAccess,
exactOptionalPropertyTypes, and noUnusedLocals/Parameters. A TypeScript
upgrade can surface new strict-mode errors under these flags that didn't
exist before — treat every new error as a real type-safety gap to fix,
not a flag to loosen. Do not weaken tsconfig.json to make an upgrade pass.
```

---

## Anti-Patterns

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| Upgrade every dependency in one commit | One package (or tightly-coupled group) per commit |
| Skip the target version's migration guide | Read it before touching code |
| Loosen `tsconfig.json` strict flags to silence new errors | Fix the underlying type gap |
| Assume a passing build means the upgrade is safe | Run the full gate: typecheck, lint, test, UI audit |
| Patch a hand-authored `core/design-system/ui/` primitive around a deprecation warning without reading why | Understand the replacement API, migrate deliberately |

---

## Migration Checklist

- [ ] Migration guide read for the target version, not just the changelog diff
- [ ] Upgraded one package/group at a time, committing after each
- [ ] `npm run typecheck`, `npm run lint`, `npm run test` all pass after the full upgrade
- [ ] `python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red` passes
- [ ] `middleware.ts` and the Server/Client boundary re-verified after a Next.js/React upgrade
- [ ] No `tsconfig.json` strict flag was loosened to force a pass
- [ ] `skills/references/template-invariants.md` re-checked against the diff
