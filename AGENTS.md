# AI Agent Instructions — Next.js Web Starter Template

**Mandatory for every coding agent** (Cursor, Claude Code, GitHub Copilot, OpenAI Codex, OpenCode, Windsurf, Gemini, Aider, etc.) working in this repository.

| Tool | How it loads this |
|------|-------------------|
| **Any** | Read `AGENTS.md` (this file) |
| **Claude Code** | `CLAUDE.md` → here |
| **GitHub Copilot** | `.github/copilot-instructions.md` → here |
| **Cursor** | `.cursor/rules/` (if present) + this file |
| **OpenCode** | `AGENTS.md` at repo root (also reads `CLAUDE.md`) |
| **Gemini** | `GEMINI.md` → here |

You do not need the user to say "use skills." **Read and follow the skill library automatically** before implementing or reviewing non-trivial work.

---

## Step 0 — Token management

Read `skills/references/token-management.md` once per session, alongside `skills/START_HERE.md`. It covers Caveman (output compression) and Graphify (codebase-query compression) — the two standing cost-reduction tools this repo expects an agent session to use.

---

## Step 1 — Route the task (always)

1. Read **`skills/START_HERE.md`** and pick the workflow that matches the task.
2. Read every **`skills/<path>/SKILL.md`** listed in that workflow **before** writing code.
3. For the first code change this session, also skim (then treat as cached — see
   `skills/references/token-management.md`):
   - `skills/references/template-invariants.md`
   - `skills/references/clean-code-doctrine.md`
4. Finish with **`skills/quality/nextjs-code-review/SKILL.md`** when the task changes production code.

Full index and stack reference: **`skills/SKILLS.md`**.

---

## Step 2 — Quick skill picker

| Task | Read first |
|------|------------|
| Page, component, layout, theme, empty/error/loading UI | `skills/build/nextjs-ui/SKILL.md` |
| New feature folders, structure, naming, route groups | `skills/build/nextjs-architecture/SKILL.md` |
| API client, repositories, auth tokens, error envelopes | `skills/build/nextjs-backend/SKILL.md` |
| TanStack Query, Zustand, cache invalidation | `skills/build/nextjs-state/SKILL.md` |
| WebSocket connection, reconnect, live data | `skills/build/nextjs-realtime/SKILL.md` |
| Tests | `skills/quality/nextjs-testing/SKILL.md` |
| Auth, roles, route guards, middleware | `skills/quality/nextjs-security/SKILL.md` |
| Bugs, hydration errors, re-render issues | `skills/diagnose/nextjs-debugging/SKILL.md` |
| Next.js / package major-version upgrades | `skills/diagnose/nextjs-migration/SKILL.md` |
| CI, deployment, env management | `skills/ship/nextjs-devops/SKILL.md` |
| Runtime targets, edge/node, hosting specifics | `skills/ship/nextjs-platform/SKILL.md` |
| Bundle size, lists, re-renders, Core Web Vitals | `skills/ship/nextjs-performance/SKILL.md` |
| Accessibility | `skills/design/nextjs-accessibility/SKILL.md` |
| PRD / feature planning | `skills/design/nextjs-product/SKILL.md` |
| Design handoff / Figma | `skills/design/nextjs-handoff/SKILL.md` |
| Scoping a vague request before architecture starts | `skills/design/nextjs-grill-me/SKILL.md` |
| **Final review (always last)** | `skills/quality/nextjs-code-review/SKILL.md` |
| Judgment pass on a finished feature/PR, pre-merge | `skills/quality/nextjs-grill-output/SKILL.md` |

---

## Step 3 — Project anchors (do not reinvent)

| Area | Location |
|------|----------|
| Design tokens | `core/design-system/` |
| App config (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_ENV`) | `core/config/app-config.ts` |
| Shared shell / dashboard example | `examples/app-modules/sample-shell/` (`sample-shell.tsx`, `sample-shell-tabs.tsx`) |
| Shared UI states | `core/shared/components/` (`AppEmptyState`, `AppErrorState`, `AppSkeleton`) |
| Network + auth | `core/network/` + `core/auth/` |
| Features | `features/<feature>/` (`data/sources+repositories`, `domain/entities+repositories+use-cases`, `presentation/hooks+stores+components`) |
| Reference auth feature | `examples/reference-features/auth/` |

Use **existing** patterns. Do not add parallel abstractions when a skill or reference file already defines the approach.

---

## Step 4 — UI consistency (common)

- **Empty states:** `AppEmptyState`
- **Error states:** `AppErrorState`
- **Loading:** `AppSkeleton` / `Skeleton` — not full-screen spinners for page loads
- **Radii / spacing / colors:** design tokens in `core/design-system/tokens.css` (via Tailwind CSS variables) — no magic numbers

Optional UI audit before large UI PRs:

```bash
python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red
```

---

## Step 5 — Definition of done

Work is not complete until it meets **`skills/references/definition-of-done.md`**.

Validate skills index after editing skills:

```bash
python skills/scripts/validate_skills.py
```

---

## Step 6 — Before every `git push` (non-negotiable)

Run `bash tool/pre_push_check.sh` (or confirm `python tool/install_git_hooks.py`
was already run this clone, which makes this automatic). It runs the exact
same checks as `.github/workflows/ci.yml`'s `validate` job — if it fails
locally, the push will fail in CI too. **Never push on a failing check,
and never push with `--no-verify` to route around a real failure** — fix
the failure or, if it's a false positive, fix the check itself and verify
that fix against a genuine fresh clone (not the working tree you've been
iterating in — leftover `node_modules`/`.next` or an untracked file can
pass locally while CI, starting from nothing, fails). This project has had
pushes land with CI red because a check was verified only against a local
working tree instead of a fresh clone — don't repeat that.

---

## If you cannot read files

Ask the user to attach `skills/START_HERE.md` and the relevant `SKILL.md`, or paste their contents. Do not guess project conventions.
