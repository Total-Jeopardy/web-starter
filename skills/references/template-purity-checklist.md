# Template Purity Checklist

Use this before merging changes to the starter itself.

## Core questions

1. Does the default app still boot with `NEXT_PUBLIC_APP_PRESET=no_auth` and
   `NEXT_PUBLIC_AUTH_PROVIDER=none`?
2. Did any product-specific UI, routes, copy, or backend assumptions leak into
   `core/`, `app/providers.tsx`, `app/layout.tsx`, or `app/(no-auth)/`?
3. Are new auth providers optional adapters (`core/auth/auth-adapter.ts`
   implementations) rather than core requirements?
4. If a sample surface was added, does it live under `examples/`?
5. Can a project ignore every shipped example and still use the architecture
   intact?

## Cost questions

1. Did this change reduce or increase the amount of repo context an agent needs
   to load?
2. Did a long explanation land in `README.md` when it belongs in a focused
   reference file?
3. Did imports, hooks, or routing become more coupled than before?

## Required checks

- `python skills/scripts/validate_skills.py`
- `python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
