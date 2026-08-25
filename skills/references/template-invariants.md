# Template Invariants

> These are the non-negotiables for this Next.js template. Every core skill must agree with them.
> Clean-code language is defined in `skills/references/clean-code-doctrine.md`.

---

## Locked Rules

1. Feature-first architecture:
   All feature code lives under `features/<feature>/`.
2. Explicit feature sub-structure:
   Use `data/sources/` + `data/repositories/`, `domain/entities/` + `domain/repositories/` + `domain/use-cases/`, and `presentation/hooks/` + `presentation/stores/` + `presentation/components/`.
3. Repository contract:
   Repositories and use-cases return `Result<T,E>` and do not throw for expected failures.
4. Cross-feature isolation:
   Feature code does not import from other features. Shared concerns move into `core/`.
5. Network ownership:
   `core/network/api-client.ts` owns the base URL, auth headers, credentials mode, and request correlation.
6. Token storage boundary:
   Bearer tokens only go through `core/auth/token-storage-provider.ts`. Cookie-based auth adapters skip token storage entirely and rely on `credentials: 'include'`.
7. Local storage boundary:
   `core/storage/client-cache.ts` is for non-sensitive values and caches only.
8. Router ownership:
   Auth/session redirects are owned by `middleware.ts` calling pure functions in `core/router/route-guards.ts`, not imperative `router.push()` calls scattered through components. Middleware is a coarse UX gate only — real authorization stays server-side.
9. UI ownership:
   Components render state; hooks, use-cases, and repositories own business logic.
10. Clean code ownership:
    Names should make intent obvious without explanatory comments.
11. Use-case preference:
    Non-trivial business actions should prefer `domain/use-cases/` instead of growing hooks.
12. Component decomposition:
    Pages/components should be decomposed before they become god components.
13. Review order:
    `quality/nextjs-code-review/SKILL.md` runs last.

---

## Current Source Of Truth

- `core/network/api-result.ts`
- `core/network/api-client.ts`
- `middleware.ts`
- `core/router/route-guards.ts`
- `core/router/route-registry.ts`
- `core/auth/auth-adapter.ts`
- `core/auth/token-storage-provider.ts`
- `examples/reference-features/auth/data/repositories/auth-repository-impl.ts`
- `examples/reference-features/auth/data/sources/auth-remote-source.ts`
- `examples/reference-features/auth/domain/entities/auth-state.ts`
- `examples/reference-features/auth/domain/repositories/auth-repository.ts`
- `examples/reference-features/auth/presentation/hooks/use-auth.ts`
