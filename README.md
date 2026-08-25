# Next.js Web Starter Template

Production-ready Next.js starter focused on reusable architecture, AI-assisted
workflow, and minimal default product assumptions.

## What it is

- feature-first Next.js template with explicit `sources+repositories`, `entities+repositories+use-cases`, and `hooks+stores+components`
- generic app shell that defaults to `no_auth`
- optional auth integrations for a reference backend and project-specific adapters
- optional sample surfaces under `examples/`, including a sample dashboard shell (sidebar + topbar)
- skills system for consistent AI-assisted build, review, and QA work

This repo is meant to stay reusable across projects. If a change forces every
new project to rewrite the starter immediately, it probably does not belong in
the template core.

## Fast start

```bash
git clone https://github.com/Total-Jeopardy/web-starter my_new_project
cd my_new_project
python tool/rename_app.py --app-name "My App" --package-name my-app
npm install
cp .env.example .env.local
npm run dev
```

## Default behavior

- `NEXT_PUBLIC_APP_PRESET=no_auth`
- `NEXT_PUBLIC_AUTH_PROVIDER=none`
- no login screen in the default boot path
- no required backend vendor SDKs in the template core

## Optional presets

Reference backend sample — set in `.env.local`:

```bash
NEXT_PUBLIC_APP_PRESET=backend_auth_sample
NEXT_PUBLIC_AUTH_PROVIDER=reference_backend
NEXT_PUBLIC_API_BASE_URL=https://your-api.com
NEXT_PUBLIC_ENV=dev
```

Supported `NEXT_PUBLIC_AUTH_PROVIDER` values:

- `none`
- `reference_backend`
- `custom_backend`

## Custom backend path

Generate a scaffold for the permanent `custom_backend` slot:

```bash
python tool/generate_custom_auth_scaffold.py your_backend
```

Generate the scaffold plus an optional example login module:

```bash
python tool/generate_custom_auth_scaffold.py your_backend --with-example-module
```

Generate the scaffold plus an integration-test placeholder:

```bash
python tool/generate_custom_auth_scaffold.py your_backend --with-integration-test
```

## Structure

- `core/`: shared runtime, design system, logging, network, storage
- `app/`: App Router routes, root layout, providers (composition root)
- `app/(no-auth)/`: default template route group
- `examples/`: optional sample app surfaces
- `examples/reference-features/auth/`: reference backend-auth feature example using the full `data/domain/presentation` sub-structure
- `skills/`: AI operating layer and repo doctrine

Vendor-specific auth/backends should be added at the project layer through
the `custom_backend` slot instead of shipping in the starter itself.

Short structural references:

- [skills/references/template-surface-map.md](skills/references/template-surface-map.md)
- [skills/references/template-purity-checklist.md](skills/references/template-purity-checklist.md)
- [skills/references/template-invariants.md](skills/references/template-invariants.md)

## Logging and network

- structured JSON logs
- configurable `NEXT_PUBLIC_LOG_LEVEL=debug|info|warn|error`
- optional remote sink via `REMOTE_LOG_URL` and `REMOTE_LOG_BEARER_TOKEN` (server-only)
- per-request correlation IDs via `NEXT_PUBLIC_REQUEST_ID_HEADER`
- `core/network/api-client.ts` wraps `fetch` with credentials mode, bearer-token injection, and a configurable error-envelope parser
- `Result<T, E>` discriminated union — repositories/use-cases never throw for expected failures

Template version:

- [TEMPLATE_VERSION](TEMPLATE_VERSION)

## Generate a feature

```bash
python skills/scripts/generate_feature_scaffold.py booking-history
```

Generate the feature plus matching unit-test scaffolding explicitly:

```bash
python skills/scripts/generate_feature_scaffold.py booking-history --with-tests
```

(`--with-tests` is already the default — this flag is only useful for
readability in scripts/CI that want the behavior stated explicitly.)

Skip use-cases for a trivial feature:

```bash
python skills/scripts/generate_feature_scaffold.py booking-history --no-use-cases
```

Skip generated tests only when you intentionally want source files without the
matching `test/features/` scaffold:

```bash
python skills/scripts/generate_feature_scaffold.py booking-history --no-tests
```

## Skills-first workflow

Start here:

- [skills/START_HERE.md](skills/START_HERE.md)
- [skills/SKILLS.md](skills/SKILLS.md)

Important references:

- [skills/references/token-management.md](skills/references/token-management.md)
- [skills/references/clean-code-doctrine.md](skills/references/clean-code-doctrine.md)
- [skills/references/definition-of-done.md](skills/references/definition-of-done.md)

## Validation

```bash
python skills/scripts/validate_skills.py
python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

## Before first real release

- Wire a real auth backend behind `custom_backend` or `reference_backend`, or keep `none` for a public app.
- Configure CI secrets for `REMOTE_LOG_URL`/`REMOTE_LOG_BEARER_TOKEN` if remote logging is used.
- Replace the neutral placeholder palette in `core/design-system/tokens.css` with your brand tokens.
