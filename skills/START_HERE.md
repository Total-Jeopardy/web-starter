# Next.js Skills Operating Guide

> Start here before reading any individual skill. This file routes the AI to the minimum correct context for this exact `web-starter` template.

---

## Core Context

Read these first for any non-trivial task:
- `skills/SKILLS.md`
- `skills/references/template-invariants.md`
- `skills/references/clean-code-doctrine.md`
- `skills/references/token-management.md`
- `package.json`

If the task changes code, stay inside the existing feature-first structure and match the real patterns already present in `core/` and `examples/reference-features/auth`.

---

## Workflow By Task

### Building UI

Read in this order:
1. `skills/build/nextjs-ui/SKILL.md`
2. `skills/build/nextjs-state/SKILL.md`
3. `skills/design/nextjs-accessibility/SKILL.md`
4. `skills/ship/nextjs-performance/SKILL.md` for list-heavy or animated UI
5. `skills/quality/nextjs-code-review/SKILL.md` last

Minimum required context:
- `core/design-system`
- `core/shared/components`
- the target feature's `presentation/` folder

### Adding a feature end-to-end

Read in this order:
0. `skills/design/nextjs-grill-me/SKILL.md` — optional, run first when scope isn't already pinned down
1. `skills/build/nextjs-architecture/SKILL.md`
2. `skills/build/nextjs-backend/SKILL.md`
3. `skills/build/nextjs-state/SKILL.md`
4. `skills/build/nextjs-ui/SKILL.md`
5. `skills/references/clean-code-doctrine.md`
6. `skills/quality/nextjs-testing/SKILL.md`
7. `skills/quality/nextjs-code-review/SKILL.md` last

Minimum required context:
- `examples/reference-features/auth`
- `core/network`
- `core/router`

### Backend or API work

Read in this order:
1. `skills/build/nextjs-backend/SKILL.md`
2. `skills/build/nextjs-state/SKILL.md`
3. `skills/references/use-case-pattern.md`
4. `skills/quality/nextjs-security/SKILL.md` if auth or protected routes are involved
5. `skills/quality/nextjs-testing/SKILL.md`
6. `skills/quality/nextjs-code-review/SKILL.md` last

Minimum required context:
- `core/network/api-client.ts`
- `core/network/api-result.ts`
- `examples/reference-features/auth/data/repositories/auth-repository-impl.ts`

### Auth or security work

Read in this order:
1. `skills/quality/nextjs-security/SKILL.md`
2. `skills/build/nextjs-backend/SKILL.md`
3. `skills/build/nextjs-state/SKILL.md`
4. `skills/references/use-case-pattern.md`
5. `skills/quality/nextjs-testing/SKILL.md`
6. `skills/quality/nextjs-code-review/SKILL.md` last

Minimum required context:
- `core/auth/auth-adapter.ts`
- `core/auth/token-storage-provider.ts`
- `middleware.ts`
- `core/router/route-guards.ts`
- `examples/reference-features/auth/presentation/hooks/use-auth.ts`

### Realtime work

Read in this order:
1. `skills/build/nextjs-realtime/SKILL.md`
2. `skills/build/nextjs-state/SKILL.md`
3. `skills/quality/nextjs-testing/SKILL.md`
4. `skills/quality/nextjs-code-review/SKILL.md` last

Minimum required context:
- `core/config/app-config.ts` (`NEXT_PUBLIC_WS_URL`)
- `core/network`

### Testing

Read in this order:
1. `skills/quality/nextjs-testing/SKILL.md`
2. the feature skill that matches the work area
3. `skills/quality/nextjs-code-review/SKILL.md`

Minimum required context:
- current feature folder
- `core/network`
- `examples/reference-features/auth`

### Debugging

Read in this order:
1. `skills/diagnose/nextjs-debugging/SKILL.md`
2. the matching feature skill for the broken area
3. `skills/quality/nextjs-code-review/SKILL.md` if the bug likely comes from implementation drift

### Migration

Read in this order:
1. `skills/diagnose/nextjs-migration/SKILL.md`
2. `skills/build/nextjs-backend/SKILL.md` for networking changes
3. `skills/build/nextjs-state/SKILL.md` for TanStack Query / Zustand changes
4. `skills/ship/nextjs-devops/SKILL.md` before changing CI or release flow

### Reviewing

Read in this order:
1. the feature skill(s) that match the changed area
2. `skills/references/definition-of-done.md`
3. `skills/quality/nextjs-code-review/SKILL.md` last, always
4. `skills/quality/nextjs-grill-output/SKILL.md` — once per feature/PR, after code-review passes, before merge

### Shipping

Read in this order:
1. `skills/ship/nextjs-devops/SKILL.md`
2. `skills/ship/nextjs-platform/SKILL.md`
3. `skills/ship/nextjs-performance/SKILL.md`
4. `skills/references/definition-of-done.md`

---

## Copy, Don't Invent

When a task needs code shape rather than prose, use:
- `skills/references/feature-scaffold.md`
- `skills/references/repository-pattern.md`
- `skills/references/state-patterns.md`
- `skills/references/auth-guarded-route.md`
- `skills/references/testing-expectations.md`
- `skills/references/use-case-pattern.md`

If a literal starting point is needed, mirror the corresponding files in `skills/assets/`.
If a new feature skeleton is needed, run `python skills/scripts/generate_feature_scaffold.py your-feature-name`.

---

## Finish Line

Work is not done until it satisfies `skills/references/definition-of-done.md`.
