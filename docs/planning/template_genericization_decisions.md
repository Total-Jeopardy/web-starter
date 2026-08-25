# Template Genericization Decisions

Living decisions log for deliberate genericization choices in this
template. Short, self-contained entries: decision, reasoning, downstream
impact. Same format as `flutter-starter`'s file of the same name.

---

## 2026-08-24 — Design tokens ship as neutral placeholders, not brand colors

**Decision:** `core/design-system/tokens.css` defines a neutral gray scale
plus one restrained neutral accent — no brand hex values anywhere in the
template core.

**Reasoning:** This template is cloned into many unrelated projects. Baking
in any specific brand palette would force every new project to immediately
rewrite `core/design-system/` before it could look like their product,
which fails the template's own "if a change forces every new project to
rewrite the starter immediately, it probably doesn't belong in the core"
test.

**Downstream impact:** Every project that clones this template edits the
HSL values in `tokens.css` (and only there) to apply real brand colors.
Components never hardcode hex/rgb values — they reach through Tailwind
utility classes bound to these CSS variables, so a palette swap is a
one-file change.

---

## 2026-08-24 — Reference auth credential shape is concrete, not abstracted

**Decision:** `examples/reference-features/auth/domain/repositories/auth-repository.ts`
declares `login(phone: string, password: string)` directly, rather than a
generic `login(credentials: Credentials)` abstraction.

**Reasoning:** Mirrors the Flutter template's own documented decision.
A generic `Credentials` interface sounds more "reusable" but in practice
just moves the concrete shape one level down while adding an indirection
layer every reader has to unwind. Since this is an *example* feature meant
to be read, copied, and adapted — not a piece of permanent core
infrastructure — concreteness teaches the pattern faster than false
generality would.

**Downstream impact:** A project with a different login shape (email+password,
magic link, OAuth) copies this feature's folder structure and use-case
pattern, not its exact repository signature. The abstraction that matters
(`Result<T, E>`, the use-case/repository split) is still generic; only the
credential shape is concrete.

---

## 2026-08-24 — Error-envelope field names are configurable, not hardcoded to RFC 7807

**Decision:** `core/network/error-envelope.ts` accepts a field-name map
(`messageFields`, `codeFields`, `statusFields`) instead of assuming every
backend returns RFC 7807's `type`/`title`/`status`/`detail` shape.

**Reasoning:** RFC 7807 is a reasonable default but far from universal —
plenty of real backends return `{message, error_code}` or
`{errors: [...]}`
 or something else project-specific. Hardcoding one convention into
`core/network/` would mean every project whose backend doesn't match it
has to fork the parser instead of configuring it.

**Downstream impact:** `core/network/api-client.ts` calls
`parseErrorEnvelope` with `defaultErrorEnvelopeFieldMap` out of the box
(covers the common `message`/`error`/`detail`/`title` cases), and a project
can pass its own field map without touching `api-client.ts` itself.

---

## 2026-08-24 — Token storage defaults to `sessionStorage`, not `localStorage`

**Decision:** `core/auth/token-storage-provider.ts`'s default
`BrowserTokenStorage` persists bearer tokens in `sessionStorage`.

**Reasoning:** `localStorage` tokens outlive the tab and are more exposed
to long-lived XSS payloads; `sessionStorage` gives a safer-by-default
starting point for a template that many different projects will use
without necessarily auditing the choice. Projects with a real security
review can swap in an `httpOnly` cookie-based adapter instead (skip token
storage entirely) or extend the lifetime deliberately.

**Downstream impact:** Bearer tokens don't survive a closed tab by default.
Projects needing "remember me" behavior implement it explicitly rather than
inheriting it silently.
