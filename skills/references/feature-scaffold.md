# Feature Scaffold Reference

Use this when creating a new feature. Copy the local pattern from `examples/reference-features/auth`, not a generic Next.js sample.

Quick generator:
```bash
python skills/scripts/generate_feature_scaffold.py booking-history
```

Add `--no-use-cases` only for trivial hook-to-repository features:
```bash
python skills/scripts/generate_feature_scaffold.py booking-history --no-use-cases
```

Generate matching `test/features/booking-history/` scaffolding with `--with-tests`
(off by default — this template ships no example project feature, so tests are
opt-in per generated feature):
```bash
python skills/scripts/generate_feature_scaffold.py booking-history --with-tests
```

```text
features/your-feature/
  data/
    repositories/
      your-feature-repository-impl.ts
    sources/
      your-feature-remote-source.ts
  domain/
    entities/
      your-feature-item.ts
      your-feature-state.ts
    repositories/
      your-feature-repository.ts
    use-cases/
      load-your-feature-use-case.ts
  presentation/
    hooks/
      use-your-feature.ts
    stores/
      your-feature-store.ts
    components/
      your-feature-view.tsx
```

Rules:
- `presentation/` owns hooks, stores, and components
- sources depend on `core/network/api-client.ts` or a storage abstraction, never raw `fetch`
- repositories compose sources and map DTOs into domain entities
- use-cases own non-trivial business orchestration
- hooks wrap use-cases/repositories with TanStack Query (`useQuery`/`useMutation`) and expose the API a component consumes
- Zustand stores hold only client-only UI state, never server data or tokens
- feature code does not import from other feature folders
- generated tests should mirror the scaffold under `test/features/your-feature/`
