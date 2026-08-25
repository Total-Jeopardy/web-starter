# Next.js Handoff Skill

> Turning a Figma file (or any static design) into tokens and components that match this template's design system, and flagging the gaps that always show up in handoff.

## When To Use

Use this skill when translating a Figma link, exported design spec, or screenshot into code — before writing any component.

Related:
- `skills/build/nextjs-ui/SKILL.md`
- `skills/design/nextjs-accessibility/SKILL.md`

---

## Step 1 — Extract Tokens, Not One-Off Values

Never copy a hex value or pixel size straight from Figma's inspector into a component. Map it to the existing token system first.

| Figma inspector shows | Map to |
|---|---|
| A fill color | Closest existing CSS variable in `core/design-system/tokens.css` (`--primary`, `--muted`, `--destructive`, …) |
| A font size/weight | An existing Tailwind text utility (`text-sm`, `text-lg font-semibold`) — check `core/design-system/typography.ts` first |
| A spacing value | Tailwind's spacing scale (`p-4`, `gap-2`) — not an arbitrary value like `p-[13px]` unless truly one-off and documented why |
| A corner radius | `--radius-lg/md/sm` in `tokens.css`, exposed as `rounded-lg/md/sm` |

If the design uses a color/size that doesn't map to an existing token, that's a decision point — flag it (see Step 3), don't silently invent a new one-off value.

---

## Step 2 — Identify Existing Primitives Before Building New Ones

Check `core/design-system/ui/` and `core/shared/components/` before building a new component:

| Design shows | Likely maps to |
|---|---|
| A button | `core/design-system/ui/button.tsx` (`variant`/`size` props) |
| A text field | `core/design-system/ui/input.tsx` |
| A modal/overlay | `core/design-system/ui/dialog.tsx` |
| A menu/select popover | `core/design-system/ui/dropdown-menu.tsx` |
| A toast/snackbar | `core/design-system/ui/toast.tsx` + `core/shared/components/app-toast.tsx` |
| A "no data yet" state | `core/shared/components/app-empty-state.tsx` |
| A failed-fetch state | `core/shared/components/app-error-state.tsx` |
| A loading placeholder | `core/shared/components/app-skeleton.tsx` |
| A destructive confirmation | `core/shared/components/app-confirm-dialog.tsx` |

Only build a new primitive in `core/design-system/ui/` when the design genuinely needs a new interaction pattern not covered above — and even then, compose it from existing primitives (`cva` + `cn`) rather than hand-rolling raw styling.

---

## Step 3 — Flag Gaps Instead Of Guessing

Common handoff gaps and what to do about each:

| Gap | What to do |
|---|---|
| Design has no error state for a screen | Ask, or default to `AppErrorState` with a generic retry — don't ship a screen with an unhandled error path |
| Design has no loading state | Default to `AppSkeleton` shaped to match the loaded layout — don't ship a bare spinner |
| Design has no empty state | Default to `AppEmptyState` — don't ship a blank screen |
| Color doesn't map to an existing token and looks intentional (e.g. a brand accent) | Flag to the developer/designer — a new token is a deliberate `tokens.css` change, not a one-off className |
| Spacing is inconsistent between two visually-similar screens | Normalize to the nearest existing scale value, note the discrepancy |
| Design shows a component state (hover/focus/disabled) not specified | Use the design-system primitive's built-in states — don't invent new ones |

---

## Step 4 — Build With The Server/Client Boundary In Mind

A static Figma frame doesn't tell you whether a section is a Server or Client Component. Decide before building:

- Static content, no interactivity, no data fetching on the client → Server Component.
- Anything with a form, button handler, or `useQuery`/`useMutation` → Client Component, and push `'use client'` as low as possible (see `skills/build/nextjs-ui/SKILL.md`).

---

## Anti-Patterns

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| Paste a hex value straight from Figma into `className` | Map to a `tokens.css` variable or flag a new token |
| Build a new button/input/dialog component | Use `core/design-system/ui/` primitives |
| Ship a screen with no defined loading/error/empty state | Default to `AppSkeleton`/`AppErrorState`/`AppEmptyState` |
| Guess at an undefined interaction | Ask, or state the assumption explicitly in the PR description |
| Mark an entire page `'use client'` because one button needs it | Isolate the interactive piece |

---

## Handoff Checklist

- [ ] Every color maps to an existing `tokens.css` variable, or a new token was deliberately added and flagged
- [ ] Every spacing/radius value maps to the existing scale
- [ ] Existing `core/design-system/ui/` and `core/shared/components/` primitives were checked before building new ones
- [ ] Loading, empty, and error states are defined for every data-driven screen
- [ ] Server/Client Component boundary was decided deliberately, not defaulted
- [ ] Any true gap in the design was flagged, not silently guessed
