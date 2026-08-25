# Template Changelog

## 0.1.0 - 2026-08-24

- Initial release of the Next.js web starter template, the web sibling of `flutter-starter`.
- Feature-first architecture: `core/` (product-agnostic runtime), `app/` (App Router composition), `examples/` (optional sample surfaces), `features/` (project features).
- `no_auth` is the default boot path — no login screen, no vendor SDK required in the template core.
- Added `core/auth/auth-adapter.ts` with `none` (default), `reference_backend`, and a permanent `custom_backend` slot.
- Added `core/network/api-client.ts`: typed fetch wrapper with correlation IDs, bearer-token injection, and a configurable (non-RFC-7807-hardcoded) error-envelope parser.
- Added `Result<T, E>` discriminated union in `core/network/api-result.ts` — repositories/use-cases never throw for expected failures.
- Added `middleware.ts` as the single owner of auth/session route redirects, backed by pure functions in `core/router/route-guards.ts`.
- Added structured JSON logging with pluggable sinks (console always-on, remote gated on `REMOTE_LOG_URL`, server-only).
- Added hand-authored shadcn-"new-york"-style UI primitives under `core/design-system/ui/` with a neutral, unbranded token palette.
- Added the reference auth example feature under `examples/reference-features/auth/` with the full `data/domain/presentation` sub-structure.
- Added the sample dashboard shell (sidebar + topbar) under `examples/app-modules/sample-shell/`.
- Added the `skills/` doctrine system: build/design/diagnose/quality/ship skill categories, reference docs, code templates, and validation scripts.
- Added `tool/rename_app.py`, `tool/generate_custom_auth_scaffold.py`, `tool/template_audit.py`, and `skills/scripts/generate_feature_scaffold.py`.
- Added architecture enforcement tests under `test/architecture/` that statically parse imports to catch real boundary violations.
