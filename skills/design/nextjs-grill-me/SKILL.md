# Next.js Grill Me Skill

> Interrogate the developer about a new feature or plan until every open branch is
> resolved — but only the branches this template doesn't already answer.
> One question at a time. Multiple choice, not open text. Stop the moment it's resolved.

## When To Use

Before starting `skills/build/nextjs-architecture/SKILL.md` for a feature whose scope
isn't already pinned down — a new PRD, a vague request, "add X to the app." Skip this
skill entirely when the task is already fully specified (a bug fix, a ticket with
explicit acceptance criteria, a one-line copy change).

Not a substitute for `skills/design/nextjs-product/SKILL.md` — that skill turns a PRD
into a scoped plan. This skill is what runs when there is no PRD yet, or the PRD has
gaps.

---

## Ground Rule: Don't Ask What's Already Answered

Before asking anything, check:

- `skills/references/template-invariants.md` — architecture, storage, and router
  decisions are locked. Never ask "where should this state live" or "should this throw
  or return `Result<T,E>`" — those are already decided.
- `examples/reference-features/auth/` — the reference implementation. If the new feature is structurally
  similar to an existing one, read it instead of asking how the developer wants it built.
- `README.md` and any `docs/planning/*.md` already in the repo for this feature.

If a question can be answered by reading a file, read the file. Only ask the developer
about decisions that are genuinely open: feature scope, business rules, edge-case
behavior, UX branches, naming for domain concepts that don't exist yet. This is what
keeps the interrogation short — not asking fewer questions once you're already asking,
but recognizing in advance which questions don't need to be asked at all.

---

## How To Ask

- Every question goes through a multiple-choice prompt, never plain text in the reply.
- Give 2–4 concrete options representing the realistic answers — not "Yes / No" unless
  the decision genuinely is binary. The developer can still free-type something else.
- **One question at a time.** Wait for the answer before asking the next one.
- After an answer, acknowledge it in one short sentence (Caveman-compressed if active —
  see `skills/references/token-management.md`) and move straight to the next question.
  No recap of the whole conversation so far.

---

## Flow

1. Read the invariants and any structurally similar existing feature first.
2. Build a short mental list of what's genuinely undecided.
3. Ask the highest-impact open question first — the one whose answer would change the
   shape of the others, so a later answer doesn't invalidate an earlier one.
4. Acknowledge, ask the next. Repeat until every branch is resolved.
5. Write the resolved decisions to `docs/planning/<feature-slug>-decisions.md` —
   self-contained, no reference to "as discussed above." This file is what another agent
   reads to execute the feature in a fresh session with zero conversation context, so it
   must stand alone: state, don't summarize.
6. Give a short closing summary of the decisions in chat. Don't repeat the file's full
   content — the developer was there for the conversation; the file is for the executor
   that wasn't.

---

## Anti-Patterns

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| Ask about something `template-invariants.md` already settles | Read the invariant, proceed |
| Ask two or three questions in one message | One question, wait, then the next |
| Open-ended text question ("How should this work?") | Concrete multiple-choice options |
| Keep asking after every branch is resolved, "to be thorough" | Stop the moment the tree is resolved |
| Recap the entire conversation after each answer | One-line acknowledgment, then the next question |
| Leave decisions only in chat history | Write them to `docs/planning/<feature-slug>-decisions.md` |

---

## Checklist

- [ ] Checked `template-invariants.md` and the closest existing feature before asking anything
- [ ] Every question used multiple-choice, one at a time
- [ ] No question asked something already answered by an existing file
- [ ] Decisions written to a self-contained `docs/planning/<feature-slug>-decisions.md`
- [ ] Closing summary given, not a re-paste of the file
