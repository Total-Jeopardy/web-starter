# Next.js Product Skill

> Turning a PRD or user story into a scoped, buildable plan against this template's architecture — before code starts.

## When To Use

Use this skill when a PRD, ticket, or user story exists and needs to become an implementation plan: feature breakdown, edge cases, and an estimate of what's actually involved given the existing architecture.

Not the same as `skills/design/nextjs-grill-me/SKILL.md` — that skill fills gaps in an *incomplete* spec through interrogation. This skill takes an already-adequate spec and turns it into a plan.

---

## Step 1 — Map The PRD To Existing Architecture

Before estimating anything, identify what the PRD maps to in this template:

| PRD says | Maps to |
|---|---|
| "Users can view/create/edit X" | A new feature under `features/x/` — see `skills/build/nextjs-architecture/SKILL.md` |
| "X requires being logged in" | `core/router/route-registry.ts` entry + `middleware.ts` — see `skills/references/auth-guarded-route.md` |
| "X updates live for other users" | `skills/build/nextjs-realtime/SKILL.md` |
| "X is available to admins only" | Role check inside the use-case/hook layer, backed by server-side authorization — never a UI-only gate |
| "X should work offline" | Out of scope for this template as shipped — flag explicitly, this is a deliberate scope decision, not a default capability |

---

## Step 2 — Break Into Vertical Slices

Per this repo's working doctrine, prefer full vertical slices (domain + infra + presentation + tests) over building all data layers first, then all UI. For a PRD with multiple screens/actions, sequence the plan as:

1. The single most central read (e.g. "view order list") — full slice, becomes the pattern for the rest
2. Each subsequent read/write, reusing the established pattern
3. Cross-cutting concerns last (empty states for edge cases, permission-gated variants)

---

## Step 3 — Enumerate Edge Cases Explicitly

A PRD almost never lists these; a plan must call them out before estimation, not discover them mid-build:

- What does the empty state say/show?
- What does the error state say/show, and is retry available?
- What happens on a slow network (loading state shape — full-page or inline)?
- What happens if the same action is triggered twice (double-submit)?
- What happens if the underlying resource was deleted/changed by someone else mid-session (stale mutation target)?
- Is there a permission boundary, and is it enforced server-side (required) in addition to hidden client-side (UX only)?

---

## Step 4 — Size Against The Template, Not From Scratch

Because this template's data/domain/presentation shape is fixed, sizing a feature is close to counting files, not open-ended estimation:

- 1 entity + 1 state type
- 1 repository interface + 1 impl
- 1–2 sources
- 0–2 use-cases (only if orchestration is non-trivial — see `skills/references/use-case-pattern.md`)
- 1–3 hooks (queries/mutations)
- 1 store only if there's genuine client-only UI state
- N components, decomposed per `skills/references/clean-code-doctrine.md`
- Matching tests per `skills/references/testing-expectations.md`

A feature that doesn't fit this shape cleanly is a signal to re-read the PRD, not to invent a parallel structure.

---

## Anti-Patterns

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| Start coding straight from a PRD with unlisted edge cases | Enumerate empty/error/loading/double-submit/permission cases first |
| Treat "admin-only" as a client-side-only check | Enforce server-side; client-side is UX only |
| Estimate a feature as if this were a greenfield stack decision | Size against the fixed template shape (file count, not vibes) |
| Build all data layers for every screen before any UI | Vertical slice one flow first, reuse the pattern |
| Silently assume offline/realtime support | Flag it explicitly as in/out of scope |

---

## Checklist

- [ ] PRD concepts mapped to `features/`, `core/router/`, `middleware.ts`, or explicitly flagged as out of scope
- [ ] Vertical-slice build order established
- [ ] Empty/error/loading/double-submit/permission edge cases enumerated
- [ ] Server-side enforcement identified for any permission boundary
- [ ] Sizing done against the template's fixed layer shape
