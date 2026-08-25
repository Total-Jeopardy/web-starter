# Next.js Grill Output Skill

> The adversarial judgment pass. Catches what a checklist structurally can't:
> code that's clean per-file but wrong at the feature level.
> Runs once per feature/PR, right before merge — never per file.

## When To Use

After `skills/quality/nextjs-code-review/SKILL.md` has already passed on every changed
file, and right before the feature/PR is merged and pushed. That ordering matters: this
skill assumes the mechanical issues (missing `'use client'`, unrendered error states,
magic numbers) are already gone, so it can spend its attention on architecture and
judgment instead of re-finding what a linter would have caught for free.

Do not run this per file, and do not run it mid-feature. It costs more than
`nextjs-code-review` on purpose — that cost is only worth paying once, at the point a
unit of work is about to become permanent.

## How It Relates To `nextjs-code-review`

| | `nextjs-code-review` | `nextjs-grill-output` |
|---|---|---|
| Unit of work | Every file | Every feature/PR |
| Check type | Mechanical, deterministic (50 checks, table-driven) | Judgment — "is this the right design," not "does this line follow the rule" |
| Cost | Near-free, runs constantly | Expensive by design, runs once per PR |
| Catches | Missing `'use client'`, unhandled query errors, hardcoded colors, `Result<T,E>` usage | Duplicated sources of truth, one-off logic dressed as reusable, hardcoded assumptions that pass every mechanical check |

They are not redundant and should not be merged. A change can pass all 50 checks and
still be the wrong change — that gap is what this skill exists to close.

---

## Two-Phase Process

### Phase 1 — Cheap scan

Read the diff for the feature, not the whole codebase. For each category below, look
for **one confirmed hit** and stop looking for more of that category — this phase
answers "does this PR have this problem," not "how many times." Vet every hit by reading
the actual code before calling it a finding; a pattern match alone is not a finding.

Categories to hunt:

- **Duplicated source of truth** — two places that must be kept manually in sync instead
  of one place the other reads from. (E.g. a nav component hardcoding its own tab list
  instead of reading `core/router/route-registry.ts`.)
- **One-off logic presented as reusable** — a component or hook added to `core/` or
  `core/shared/` that actually only fits the one feature that just used it.
- **Hardcoded assumptions** — literal copy, brand colors, or business rules introduced as
  if they were defaults, the same way this template's own `tokens.css` is deliberately a
  neutral placeholder palette rather than one project's real brand colors.
- **Invariant violations that don't trip the linter** — e.g. a repository that returns
  `Result<T,E>` correctly but still leaks a business decision that belongs in a use-case,
  or a hook that's technically valid TanStack Query but is doing orchestration that
  should be extracted.
- **Server/Client boundary drift** — a component marked `'use client'` "just in case" that
  doesn't actually need it, silently growing the client bundle.

Present findings the same way `nextjs-code-review` doesn't: plain-language, no
`file:line`, no counts yet — the developer is deciding whether each is worth fixing, not
where.

### Phase 2 — Full sweep (only for what's chosen)

Ask which findings to act on. For only those, now do the exhaustive pass: every location
the pattern appears, each with `file:line`. Write a self-contained fix plan to
`docs/review/<feature-slug>-findings.md` — assume zero context, since another agent
executes this in a fresh session, not this conversation.

Never touch source code in this skill. It reviews and plans; it does not fix. Fixing
happens in the session that reads the plan this phase produces.

---

## Anti-Patterns

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| Run this per file, like `nextjs-code-review` | Run once per feature/PR |
| Merge this into the 50-check gate | Keep them separate — one mechanical, one judgment |
| List `file:line` for every category during Phase 1 | Plain-language findings only, until the developer picks |
| Full-sweep every category regardless of what was picked | Full sweep only for chosen findings |
| Edit source code directly from this skill | Write a plan; let the next session execute it |
| Re-flag something `nextjs-code-review` already would have caught | Assume the mechanical pass already ran and passed |

---

## Checklist

- [ ] `nextjs-code-review` already passed on every changed file
- [ ] Running once for the whole feature/PR, not per file
- [ ] Phase 1 stopped at one confirmed hit per category, no line numbers shown yet
- [ ] Developer picked which findings to act on before Phase 2 started
- [ ] Fix plan for chosen findings is self-contained in `docs/review/<feature-slug>-findings.md`
- [ ] No source file touched by this skill directly
