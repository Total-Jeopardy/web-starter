# Clean Code Doctrine

> This template prefers code that is easy to read, easy to test, and easy to extend without heroics.

---

## Core Rules

- Prefer single-responsibility functions and files.
- Prefer small components over god components.
- Prefer verb-based names for actions: `login`, `logout`, `loadProfile`, `saveDraft`.
- Prefer intention-revealing names over comments.
- Prefer use-cases for non-trivial business actions.
- Prefer code that another developer can read without walking the whole repo first.

## Naming Rules

- Functions and methods use verbs.
- Use-cases use verb + noun names: `LoginUseCase`, `FetchOrdersUseCase`.
- Hooks are `use` + verb/noun: `useAuth`, `useOrders`.
- Zustand stores are `use*Store`: `useAuthStore`, `useCartStore`.
- State/entity types describe product state, not implementation detail.
- Avoid vague names like `data`, `item`, `value`, `temp`, `handleThing`.

## Responsibility Rules

- Components render and delegate.
- Hooks own UI-facing state transitions (via TanStack Query + Zustand).
- Repositories talk to network or storage and return `Result<T,E>`.
- Use-cases coordinate multi-step business actions, branching logic, or repeated orchestration.
- Comments do not compensate for poor structure or naming.

## Component Decomposition Rules

- Break large pages into sections, cards, forms, and state components.
- Split when a component owns multiple visual regions, nested callbacks, or mixed layout and decision logic.
- Keep custom components close to the feature in `presentation/components/` unless reused by multiple features.

## Comment Policy

- Code should usually explain itself through naming and structure.
- Keep comments for intent, constraints, or non-obvious tradeoffs.
- Avoid comments that restate the next line of code.

## Use-Case Preference

Reach for a use-case when the action:
- coordinates multiple dependencies
- persists tokens or cached state
- contains branching business rules
- is likely to be reused
- deserves a direct unit test without React or TanStack Query

Hook → repository is still acceptable for trivial single-step reads.
