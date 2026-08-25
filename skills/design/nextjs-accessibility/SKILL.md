# Next.js Accessibility Skill

> Semantics, keyboard navigation, screen reader support, and contrast for this Next.js starter template.

## When To Use

Use this skill when building or reviewing any interactive UI, form, dialog, toast, or navigation surface.

Related:
- `skills/build/nextjs-ui/SKILL.md`
- `skills/references/definition-of-done.md`

---

## Stack Alignment

- Primitives in `core/design-system/ui/` (`button.tsx`, `input.tsx`, `dialog.tsx`, `dropdown-menu.tsx`) already carry focus rings and correct native semantics — use them instead of raw `<div onClick>` interactive elements.
- `core/shared/components/` state components (`AppEmptyState`, `AppErrorState`, `AppSkeleton`) already carry `role`/`aria-*` — use them instead of ad-hoc markup.

---

## Semantic HTML First

| Need | Use | Not |
|---|---|---|
| Clickable action | `<button>` (or the `Button` primitive) | `<div onClick>` |
| Navigation | `<Link>` / `<a>` | `<span onClick>` with a router push |
| Form field | `<label htmlFor>` + `<input id>` | placeholder-only "labels" |
| Grouped fields | `<fieldset>` + `<legend>` | a `<div>` with a bold `<p>` above it |
| Page landmark | `<main>`, `<nav>`, `<header>`, `<aside>` | unstyled `<div>` soup |

```typescript
// Correct: native label association
<div className="space-y-2">
  <label htmlFor="phone" className="text-sm font-medium">Phone</label>
  <Input id="phone" name="phone" type="tel" autoComplete="tel" />
</div>
```

---

## Focus Management

- Every interactive primitive in `core/design-system/ui/` ships a visible focus ring (`focus-visible:ring-2 focus-visible:ring-ring`) — do not override it away.
- When a `Dialog` opens, focus moves inside it and returns to the trigger on close — this is handled by the `dialog.tsx` primitive; don't hand-roll a modal with a plain `<div>`.
- Never trap focus outside of an actual modal/dialog context.
- Skip links are unnecessary while the app has a single main landmark per page; add one (`<a href="#main-content">Skip to content</a>`) once a persistent nav/sidebar (e.g. `sample-shell.tsx`) is adopted as a permanent shell.

---

## ARIA Rules

| Situation | Attribute |
|---|---|
| Loading region | `aria-busy="true"` + `aria-live="polite"` (already on `AppSkeleton`) |
| Error region | `role="alert"` (already on `AppErrorState`) |
| Icon-only button | `aria-label="Delete order"` — never a bare icon with no accessible name |
| Toggling disclosure (dropdown, accordion) | `aria-expanded` on the trigger |
| Toast notification | `role="status"` or `role="alert"` depending on urgency (see `core/shared/components/app-toast.tsx`) |
| Decorative icon next to visible text | `aria-hidden="true"` on the icon so it isn't announced twice |

```typescript
<Button variant="ghost" size="icon" aria-label="Delete order" onClick={handleDelete}>
  <Trash2 />
</Button>
```

---

## Color And Contrast

- All color comes from `core/design-system/tokens.css` — the shipped palette is tuned for WCAG AA text contrast against `--background`/`--card`. Do not introduce a one-off color that hasn't been checked.
- Never convey state (error, success, disabled) through color alone — pair it with an icon, label, or `aria-*` attribute. `AppErrorState` already pairs destructive color with an icon and text.
- Test dark mode explicitly — a color pairing that passes in light mode can fail in dark mode if only one side of the CSS-variable swap was checked.

---

## Keyboard Navigation

- Every action reachable by mouse must be reachable by `Tab`/`Shift+Tab` and triggerable by `Enter`/`Space`.
- Custom dropdown/menu components (`dropdown-menu.tsx`) must support arrow-key navigation between items and `Escape` to close — verify this wasn't broken by a customization, don't assume.
- Never set `tabIndex` greater than `0` — it breaks natural tab order. Use `0` to include an element, `-1` to programmatically focus it without adding it to the tab sequence.

---

## Forms

- Every input has an associated `<label>`.
- Required fields use the native `required` attribute, not just visual styling.
- Validation errors are associated with their field via `aria-describedby` and announced (`aria-live="polite"` on the error text, or `role="alert"` for the whole form-level error).
- Submit buttons show a text state change (`Logging in…`) in addition to a disabled state — a disabled button with unchanged text gives no feedback to a screen reader user.

---

## Anti-Patterns

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| `<div onClick>` for a clickable action | `<button>` or the `Button` primitive |
| Icon-only button with no `aria-label` | `aria-label` describing the action |
| Placeholder text as the only label | `<label htmlFor>` |
| Custom modal with no focus trap/return | The `Dialog` primitive |
| Color-only error/success indication | Color + icon + text |
| `tabIndex` > 0 | `tabIndex={0}` or `-1}` only |
| Toast/error with no `role`/`aria-live` | Use `AppToast`/`AppErrorState`, which already carry it |

---

## Accessibility Checklist

- [ ] All interactive elements are native or design-system primitives, not `<div onClick>`
- [ ] Every form field has an associated `<label>`
- [ ] Icon-only buttons have `aria-label`
- [ ] Loading/error/empty states use `AppSkeleton`/`AppErrorState`/`AppEmptyState`
- [ ] Focus is visible and never trapped outside an actual dialog
- [ ] Color is never the only signal for state
- [ ] Full flow is operable by keyboard alone
- [ ] Checked in both light and dark mode
