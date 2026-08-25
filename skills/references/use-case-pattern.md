# Use-Case Pattern Reference

Use this template's use-case pattern when a feature action is more than a thin repository call.

## When to introduce a use-case

Add `domain/use-cases/` when the action:
- talks to more than one dependency
- transforms repository results before UI state mapping
- persists tokens or cache
- contains branching product rules
- needs a direct unit test

## Canonical shape

```text
examples/reference-features/auth/
  data/
    repositories/
      auth-repository-impl.ts
    sources/
      auth-local-source.ts
      auth-remote-source.ts
  domain/
    entities/
      auth-state.ts
      auth-tokens.ts
      user.ts
    repositories/
      auth-repository.ts
    use-cases/
      login-use-case.ts
      logout-use-case.ts
      restore-auth-session-use-case.ts
  presentation/
    hooks/
      use-auth.ts
    stores/
      auth-store.ts
    components/
      login-form.tsx
```

## Responsibility split

- source: perform raw HTTP or local-storage reads/writes and return DTOs
- repository: compose sources and map DTOs into domain entities
- use-case: orchestrate business action, return `Result<T,E>` (or `void`/plain data for actions with nothing to fail)
- hook: wrap use-cases with `useQuery`/`useMutation`, expose UI-facing state
- component: render and trigger hook methods

## Auth example

- `LoginUseCase.execute` calls `AuthRepository.login`, saves tokens via `TokenStorage`, persists the user, returns `Result<AuthTokens, ApiError>`
- `useAuth()`'s `loginMutation` calls the use-case, maps the result into `useAuthStore` state and `useSessionStore` session state
- `LogoutUseCase.execute` clears tokens and persisted session
- `RestoreAuthSessionUseCase.execute` reconciles token + persisted-user state on boot

Keep the hook's returned API stable for the UI. Move orchestration inward, not outward.
