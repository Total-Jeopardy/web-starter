# Testing Expectations Reference

This template has `test/` with directories mirroring `core/`, `features/`, and `examples/reference-features/`, plus shared fakes in `test/fakes/`. There is no end-to-end test runner configured yet. New features should mirror `test/features/<feature>/` and add hook/component tests per the minimum surface in `nextjs-testing/SKILL.md`.

## Where tests go

Mirror the source tree under `test/`:

```text
test/
  core/
  features/
  examples/
  architecture/
  fakes/
```

Add an e2e test runner only when a real end-to-end flow needs it — do not add one speculatively.

## Minimum tests per feature

- 1 repository unit test for a success path
- 1 repository unit test for an error path
- 1 hook test for the main state transition (via Testing Library's `renderHook` + a `QueryClientProvider` wrapper)
- 1 component test for the primary rendered state
- 1 use-case unit test per non-trivial business action

If the feature changes auth, routing, or permission gating, add the matching guard test too (`core/router/route-guards.ts` is pure and unit-testable directly).

## CI behavior

- CI always runs skills validation, UI audit, `npm run typecheck`, and `npm run lint`
- CI runs `npm run test` automatically once `test/` has files in it
- do not add placeholder tests just to satisfy the pipeline
