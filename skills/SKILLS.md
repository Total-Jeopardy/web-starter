# Next.js Skills Repository — Master Instruction Manual

> **AI-Agnostic.** These skills work with Claude, Cursor, GitHub Copilot, ChatGPT, Gemini, or any AI assistant that can read files.
> **Template-Aware.** Designed to complement the `web-starter` architecture (Next.js App Router + TanStack Query + Zustand + typed fetch client).

---

## What This Repository Is

A structured library of expert-level reference files that tell an AI assistant exactly how to work with this Next.js project. Instead of re-explaining your stack on every task, you drop the relevant skill into the conversation or IDE context window — and the AI operates at expert level immediately.

**Analogy:** Think of each skill as a senior developer's brain dump on a specific topic, formatted so any AI can read and apply it.

This repository is the TypeScript/Next.js sibling of `flutter-starter`. The doctrine (feature-first, `Result<T,E>` instead of throwing, use-cases for non-trivial orchestration, router owns auth redirects, code-review runs last) is identical across both — only the language and framework specifics differ. See `skills/references/token-management.md` for the note on staying consistent between the two repos.

---

## Repository Structure

```
skills/
├── SKILLS.md                          ← You are here. Read this first.
├── START_HERE.md                      AI entry workflow for this template
├── assets/
│   ├── auth-guarded-route-template.tsx.txt
│   ├── feature-scaffold-template.ts.txt
│   ├── login-use-case-template.ts.txt
│   ├── logout-use-case-template.ts.txt
│   ├── query-hook-template.ts.txt
│   ├── store-slice-template.ts.txt
│   ├── repository-template.ts.txt
│   ├── component-decomposition-template.tsx.txt
│   ├── use-case-test-template.ts.txt
│   └── component-test-template.tsx.txt
├── references/
│   ├── auth-guarded-route.md
│   ├── clean-code-doctrine.md
│   ├── definition-of-done.md
│   ├── feature-scaffold.md
│   ├── repository-pattern.md
│   ├── state-patterns.md
│   ├── template-invariants.md
│   ├── template-purity-checklist.md
│   ├── template-surface-map.md
│   ├── testing-expectations.md
│   ├── token-management.md            Caveman + Graphify token-cost tooling
│   └── use-case-pattern.md
├── scripts/
│   ├── generate_feature_scaffold.py   Feature scaffold generator
│   └── validate_skills.py             Skills index/path validator
│
├── build/                             ← Writing and generating code
│   ├── nextjs-architecture/
│   │   └── SKILL.md                   Feature folders, layer pattern, naming rules
│   ├── nextjs-ui/
│   │   ├── SKILL.md                   Pages, components, layout, theming
│   │   └── scripts/
│   │       └── nextjs_ui_audit.py     Static UI auditor
│   ├── nextjs-backend/
│   │   └── SKILL.md                   api-client, Result<T,E>, auth tokens, error envelopes
│   ├── nextjs-state/
│   │   └── SKILL.md                   TanStack Query, Zustand, cache invalidation
│   └── nextjs-realtime/
│       └── SKILL.md                   WebSocket connection, reconnect, live data
│
├── quality/                           ← Reviewing and hardening code
│   ├── nextjs-code-review/
│   │   └── SKILL.md                   THE QUALITY GATE — runs on every output
│   ├── nextjs-grill-output/
│   │   └── SKILL.md                   Adversarial judgment pass — once per feature/PR, pre-merge
│   ├── nextjs-testing/
│   │   └── SKILL.md                   Unit, hook, and component tests with Vitest + Testing Library
│   └── nextjs-security/
│       └── SKILL.md                   Token storage, route guards, middleware
│
├── diagnose/                          ← Finding and fixing problems
│   ├── nextjs-debugging/
│   │   └── SKILL.md                   Decision trees for every bug category
│   └── nextjs-migration/
│       └── SKILL.md                   Next.js / package major-version upgrades
│
├── ship/                              ← Getting to production
│   ├── nextjs-devops/
│   │   └── SKILL.md                   CI/CD, env management, deployment
│   ├── nextjs-platform/
│   │   └── SKILL.md                   Edge vs Node runtime, hosting specifics
│   └── nextjs-performance/
│       └── SKILL.md                   Bundle size, lists, re-renders, Core Web Vitals
│
└── design/                            ← Working with design and product
    ├── nextjs-handoff/
    │   └── SKILL.md                   Figma → Next.js, token extraction, design gaps
    ├── nextjs-product/
    │   └── SKILL.md                   PRD → implementation, scoping, estimation, edge cases
    ├── nextjs-accessibility/
    │   └── SKILL.md                   Semantics, a11y, keyboard/screen reader
    └── nextjs-grill-me/
        └── SKILL.md                   Interrogate scope gaps before architecture starts
```

---

## How to Use With Any AI

Read `skills/START_HERE.md` first if you need help choosing the right skill sequence for a task.

### Claude (claude.ai / Claude Code)
Paste the skill file content into your conversation before asking for help:
```
Read this skill file first, then help me build the login page:
[paste SKILL.md content]
```
In Claude Code, reference skills directly: `@file skills/build/nextjs-architecture/SKILL.md`

### Cursor / VS Code Copilot
- Cursor: `@file skills/build/nextjs-ui/SKILL.md` in chat
- Copilot: Open the skill file in a tab before asking

### ChatGPT / Gemini
Paste the skill content directly into the conversation as context before your question.

### Any AI — Universal Method
Every skill file is plain Markdown. Copy-paste the relevant SKILL.md into any AI chat window.
The structured format (rules, anti-patterns, code examples) works universally across all AI tools.

---

## Skill Selection Guide

| Category | Skill | Triggers on |
|---|---|---|
| build | nextjs-ui | Page, component, layout, theme, empty/error/loading UI |
| build | nextjs-architecture | New feature folders, structure, naming, route groups |
| build | nextjs-backend | API client, repositories, auth tokens, error envelopes |
| build | nextjs-state | TanStack Query, Zustand, cache invalidation |
| build | nextjs-realtime | WebSocket connection, reconnect, live data |
| quality | nextjs-testing | Tests |
| quality | nextjs-security | Auth, roles, route guards, middleware |
| quality | nextjs-code-review | Final review — always runs last on any production-code change |
| quality | nextjs-grill-output | Judgment pass on a finished feature/PR, pre-merge |
| diagnose | nextjs-debugging | Bugs, hydration errors, re-render issues |
| diagnose | nextjs-migration | Next.js / package major-version upgrades |
| ship | nextjs-devops | CI, deployment, env management |
| ship | nextjs-platform | Runtime targets, edge/node, hosting specifics |
| ship | nextjs-performance | Bundle size, lists, re-renders, Core Web Vitals |
| design | nextjs-accessibility | Accessibility |
| design | nextjs-product | PRD / feature planning |
| design | nextjs-handoff | Design handoff / Figma |
| design | nextjs-grill-me | Scoping a vague request before architecture starts |

---

## Project Stack Reference

Always tell the AI this stack when starting a session:

| Layer | Technology |
|---|---|
| Language | TypeScript (strict) |
| Framework | Next.js 14 App Router |
| UI runtime | React 18 |
| Server state | TanStack Query v5 |
| Client UI state | Zustand v4 |
| Validation | Zod v3 |
| Styling | Tailwind CSS v3 + class-variance-authority |
| Icons | lucide-react |
| Architecture | Feature-first, 3-layer (data/domain/presentation) |
| Design system | Hand-authored "new-york"-style primitives in `core/design-system/ui/` + CSS-variable tokens |
| Testing | Vitest + Testing Library |

---

## Architecture Rules (Non-Negotiable)

These rules are locked. Every AI must follow them:

1. **Tokens never touch `core/storage/client-cache.ts`.** Bearer tokens → `core/auth/token-storage-provider.ts` only; cookie-based adapters skip token storage entirely.
2. **Every repository/use-case method returns `Result<T,E>`.** Never throw exceptions across layers for expected failures.
3. **Features are self-contained.** No cross-feature imports. Shared state goes through `core/` or `examples/reference-features/` patterns.
4. **Router is declarative.** No manual `router.push()` from auth-state changes — let `middleware.ts` + `core/router/route-guards.ts` drive redirects.
5. **No hardcoded colors or magic-number spacing.** Everything from `core/design-system/tokens.css` via Tailwind CSS variables.
6. **Server vs Client Component boundary is explicit.** Layouts are Server Components; anything that fetches/mutates data or uses hooks is a Client Component (`'use client'`).
7. **`useQuery`/`useMutation` for any component that reads server state; Zustand only for client-only UI state.**

---

## Running the Audit Script

Catch issues before they ship:

```bash
# From web-starter project root
python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py .

# Only show critical issues
python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red

# Full report
python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --all
```

Outputs `🔴 Critical` / `🟡 Warning` / `🟢 Info` with file:line locations. Exit code `1` if critical issues found — plug into CI.

---

## Adding New Skills

When you discover a recurring pattern, gotcha, or expert rule:

1. Create a new folder under the relevant group
   (build/ quality/ diagnose/ ship/ design/)
   with a SKILL.md inside it:
   example: skills/build/&lt;your-skill-name&gt;/SKILL.md
2. Follow this structure:
   ```markdown
   # Skill Title
   > One-line purpose statement

   ## When to Use
   ## Rules / Anti-Patterns (table format)
   ## Code Examples
   ## Checklist
   ```
3. Add a row to the Skill Selection Guide table above
4. Keep it AI-readable: concrete rules, code snippets, decision trees — no vague prose

---

## Pre-Task Checklist (Give This to Any AI)

Before starting any task, confirm the AI has read:

- [ ] Relevant skill file(s) from this repository
- [ ] The project stack (listed above)
- [ ] The architecture rules (listed above)
- [ ] `package.json` (for actual package versions)
- [ ] `skills/references/token-management.md` (Caveman + Graphify token-cost tooling)

---

*Maintained alongside the `web-starter` template. Update skills when you adopt new packages or change architecture decisions.*
