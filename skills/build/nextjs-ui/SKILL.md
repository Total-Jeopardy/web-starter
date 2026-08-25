# Next.js UI Skill

> Pages, components, layout, navigation surfaces, theming, and TanStack-Query-connected UI for this Next.js starter template.

---

## Stack Alignment

This skill is written for the current template:
- **Framework:** Next.js 14 App Router, React 18
- **Styling:** Tailwind CSS v3 + `core/design-system/tokens.css` (CSS variables) + `class-variance-authority`
- **Primitives:** `core/design-system/ui/` (button, input, dialog, dropdown-menu, toast, skeleton)
- **Shared shell/components:** `examples/app-modules/sample-shell/` today; promote to `core/shared/components/` once a project adopts a permanent shell
- **Feature UI:** `features/<feature>/presentation/components`

## When To Use

Use this skill when building or reviewing a page, component, layout, form, loading state, error state, navigation entry point, or visual feature.

Clean-code references:
- `skills/references/clean-code-doctrine.md`
- `skills/references/definition-of-done.md`

---

## Related Skills To Read

Read only what applies to the task:

| Task | Read |
|---|---|
| Feature folders or file placement | `skills/build/nextjs-architecture/SKILL.md` |
| TanStack Query / Zustand wiring | `skills/build/nextjs-state/SKILL.md` |
| API-backed pages | `skills/build/nextjs-backend/SKILL.md` |
| Performance-sensitive UI | `skills/ship/nextjs-performance/SKILL.md` |
| Accessibility | `skills/design/nextjs-accessibility/SKILL.md` |
| Final review | `skills/quality/nextjs-code-review/SKILL.md` |

Runtime audit:

```bash
python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red
```

---

## File Placement

Feature pages and sub-components live in `presentation/components/`:

```
features/products/
  presentation/
    hooks/
      use-products.ts
    stores/
      product-filter-store.ts
    components/
      products-view.tsx
      product-tile.tsx
```

Shared components used by two or more features go in `core/shared/components/` once they are promoted out of `examples/`.
Design tokens stay in `core/design-system/`.

Do not import one feature's components directly into another feature. Promote reusable UI to `core/shared/components/` first.

## Component Decomposition Rules

- Break pages into small, readable components before they become hard to scan.
- Prefer section components, field components, tiles, and explicit state components over one long JSX tree.
- Components render and delegate; they do not orchestrate business actions.
- If an event handler grows branches, extract a function or move the logic to the hook/use-case.

Use `skills/assets/component-decomposition-template.tsx.txt` when you need a local-pattern example.

---

## Server vs Client Component Boundary

This boundary is explicit in this template, not accidental:

| Component | Type | Why |
|---|---|---|
| `app/layout.tsx` | Server Component | No hooks, no state — just html/body shell + `<Providers>` |
| `app/providers.tsx` | Client Component | Owns `QueryClientProvider`, `ThemeModeProvider` — needs `useState` |
| `app/(no-auth)/page.tsx` | Server Component | Static starter content, no data fetching |
| any page/component using a hook from `presentation/hooks/` | Client Component | `useQuery`/`useMutation`/Zustand require the client runtime |

Rules:
- Put `'use client'` at the top of any file that uses a React hook, browser API, or event handler.
- Keep Server Components as the default for anything that doesn't need interactivity — smaller client bundle, faster first paint.
- Do not add `'use client'` to a layout just to make one child interactive — push the boundary down to the smallest component that needs it.

---

## Page/Component Pattern

```typescript
// features/products/presentation/components/products-view.tsx
'use client';

import { useProducts } from '@/features/products/presentation/hooks/use-products';
import { AppSkeleton } from '@/core/shared/components/app-skeleton';
import { AppErrorState } from '@/core/shared/components/app-error-state';
import { AppEmptyState } from '@/core/shared/components/app-empty-state';

export function ProductsView() {
  const { data, isLoading, error, refetch } = useProducts();

  if (isLoading) return <AppSkeleton lines={4} />;
  if (error) return <AppErrorState description={error.message} onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <AppEmptyState title="No products yet" />;

  return (
    <ul className="space-y-2">
      {data.map((product) => (
        <ProductTile key={product.id} product={product} />
      ))}
    </ul>
  );
}
```

Rules:
- `useQuery`/`useMutation` for state that affects UI, called at the top of the hook, consumed via the component
- No `fetch`/API calls or business logic in components
- No hook methods called conditionally or inside JSX — call at the top level, branch on the returned data
- No god components; split once the component owns multiple visual regions or long event handlers

---

## Theme And Design System

Use CSS-variable tokens and Tailwind utility classes wired to them. Do not hardcode hex colors or arbitrary pixel spacing in feature UI.

```typescript
// core/design-system/tokens.css defines --primary, --muted, --border, etc. as HSL triples.
// tailwind.config.ts maps them to `bg-primary`, `text-muted-foreground`, `border-border`, etc.

return (
  <p className="text-sm text-muted-foreground">
    Welcome back
  </p>
);
```

Rules:
- Colors come from Tailwind classes backed by `core/design-system/tokens.css` (`bg-primary`, `text-foreground`, `border-border`, …)
- Spacing/radii use Tailwind's scale (`p-4`, `rounded-md`) or the design-system radius tokens (`--radius-lg/md/sm`) — not arbitrary values like `p-[13px]`
- Dark mode works via the CSS-variable swap in `tokens.css` + `ThemeModeProvider` — no per-component conditionals
- Feature components should not define their own color palette

---

## Layout Rules

| Need | Use |
|---|---|
| Long dynamic list | Plain `.map()` over paginated/virtualized data; virtualize only past a few hundred rows |
| Static short vertical content | Flex/grid utility classes |
| Scrollable form | `overflow-y-auto` container with `max-h-*` |
| Responsive branching | Tailwind responsive prefixes (`md:`, `lg:`) — avoid `useMediaQuery` unless behavior, not just layout, must change |
| Dashboard shell content | `examples/app-modules/sample-shell/` pattern |
| Empty/loading/error states | `AppEmptyState` / `AppSkeleton` / `AppErrorState` — never a bare spinner or ad-hoc text |

Avoid:
- Rendering an unbounded list without pagination or virtualization
- Fixed pixel widths that break at small viewports
- Dense nested cards
- Layout that relies on one exact viewport size

---

## Navigation UI

This template uses the Next.js App Router. Route access rules belong in `core/router/route-registry.ts`; redirect logic belongs in `middleware.ts` + `core/router/route-guards.ts`.

Use:
- `<Link href="...">` for standard navigation
- `useRouter().push(path)` for post-action navigation (e.g. after a successful mutation)
- `useRouter().back()` for closing a modal-like flow

Do not use imperative auth redirects from components. Auth redirects belong in `middleware.ts`.

---

## Forms

Use local `useState` for transient text input, or a form library if the template later adopts one. Submit through a hook's mutation.

```typescript
<Button type="submit" disabled={!isValid || isLoggingIn}>
  Log in
</Button>
```

Rules:
- Use `type="password"` and `autoComplete` attributes for credential fields
- Show server errors from the hook's returned state (`authState.status === 'error'`)
- Do not store passwords in Zustand or TanStack Query cache
- Keep field validation close to the form

---

## Loading, Empty, and Error States

Every data-driven component must render all three explicitly:

```typescript
if (isLoading) return <AppSkeleton />;
if (error) return <AppErrorState onRetry={() => refetch()} />;
if (!data || data.length === 0) return <AppEmptyState />;
```

Never render a bare `<svg>` spinner loop for a known-shape loading state — use `AppSkeleton`/`Skeleton`. A bare spinner is acceptable only for a genuinely unknown-duration, unknown-shape action (e.g. a full-page redirect in flight).

---

## Accessibility Baseline

Every page must have:
- tappable/clickable controls with a visible focus ring (the design-system `Button`/`Input` primitives already provide this)
- meaningful button labels — not icon-only buttons without `aria-label`
- loading and error states announced via `aria-busy`/`aria-live`/`role="alert"` (see `AppSkeleton`, `AppErrorState`)
- text that reflows at 200% browser zoom without clipping
- semantics for custom controls (`role`, `aria-*`) when not using a native element

For deeper accessibility work, read `skills/design/nextjs-accessibility/SKILL.md`.

---

## Anti-Patterns

| NEVER | ALWAYS |
|---|---|
| Hardcode hex colors or px spacing in feature components | Use Tailwind classes backed by design tokens |
| Put `fetch`/repository calls in components | Use hooks from `presentation/hooks/` |
| Use `window.location.href` for in-app navigation | Use `<Link>` / `useRouter()` |
| Fetch data with `useEffect` + `useState` | Use `useQuery`/`useMutation` |
| Ignore a query's `error` state | Render `AppErrorState` with retry |
| Wrap an entire page in `'use client'` for one interactive button | Push `'use client'` down to the smallest component that needs it |
| Render a bare spinner `<svg>` loop for known-shape loading content | Use `AppSkeleton` |

---

## UI Checklist

- [ ] Component is in the correct feature `presentation/components/` folder
- [ ] `'use client'` boundary is as low in the tree as possible
- [ ] Page/component is decomposed into readable sub-components where needed
- [ ] Loading, empty, data, and error states are all handled with the shared state components
- [ ] Colors, spacing, and radii come from Tailwind + design tokens, not magic numbers
- [ ] Navigation uses `<Link>`/`useRouter()`, not raw anchor/location changes
- [ ] Forms use controlled inputs and do not persist secrets in state
- [ ] Accessibility baseline is covered
- [ ] `python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red` passes
