# Template Surface Map

Use this file when you need the shortest possible mental model of what belongs
where in this repository.

## Core template runtime

- `app/layout.tsx`
- `app/providers.tsx`
- `app/(no-auth)/`
- `app/api/health/route.ts`
- `middleware.ts`
- `core/`

This layer should stay reusable across projects without product-specific UI or
vendor lock-in.

## Optional examples

- `examples/app-modules/sample-shell/`
- `examples/app-modules/reference-backend-auth/`
- `app/(reference-auth)/`

These are examples, not template requirements.

## Reference feature implementation

- `examples/reference-features/auth/`

This is the canonical backend-auth feature example. Keep it useful as a pattern,
but do not let it redefine the default template boot path.

## Enforcement tests

- `test/architecture/core-import-boundary.test.ts`
- `test/architecture/template-defaults.test.ts`
- `test/architecture/example-module-boundary.test.ts`

If you change structure, update these tests deliberately instead of letting the
template drift by accident.
