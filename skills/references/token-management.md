# Token Management

> Every skill in this repository is written to be read by an AI agent before it does work.
> These two tools cut the cost of that reading. Neither is optional for a real project.

---

## Why this file exists

Two different costs stack on every agent session:

1. **Input cost** — the agent re-reading files to understand the codebase before it can act.
2. **Output cost** — the agent's own prose, explanations, and acknowledgments, which get
   fed back into context on every following turn for the rest of the session.

Caveman and Graphify each attack one side of that. They do not overlap, but they
do not contribute equally on every task.

This repository is the TypeScript/Next.js sibling of `flutter-starter` and shares
the identical token-cost discipline. If you (the agent) have already internalized
this file from a session in `flutter-starter`, nothing here changes — this is the
same discipline, restated so a session that starts fresh in `web-starter` doesn't
have to relearn it from scratch.

---

## Detecting availability — do this before assuming either tool exists

Caveman and Graphify are session/tooling features, not packages this repo installs.
Whether they exist depends on the agent environment this session is running in, not
on anything in this codebase. Check once, near the start of a session:

- **Caveman**: look for a `caveman` entry in your available skills/commands list, or
  a `[CAVEMAN]` status indicator if your environment surfaces one. If you can't find
  either, ask the user directly: "is Caveman active in this session?" Don't guess.
- **Graphify**: look for a `graphify` skill/command, or a `graphify-out/` directory
  already present at the repo root (a sign it was run before). No skill and no output
  directory means it isn't available here — don't invent a substitute tool.
- Do this check once. If a session gets compacted or restarted, re-check once, not
  per task.

**If either tool is genuinely unavailable in this environment**, the discipline still
applies, just manually:
- No Caveman → keep your own prose terse by habit: state results and next steps,
  skip restating what the user already knows, don't narrate tool calls.
- No Graphify → rely on `grep`/`ripgrep` for targeted lookups and the project anchors
  table in `AGENTS.md` instead of a queryable graph; lean harder on the session read
  cache below, since there's no relationship index to fall back on.

Never block real work on either tool's absence — they're cost optimizations, not
prerequisites. Note the absence once, then proceed.

## Caveman — output compression

Caveman compresses what the agent *writes*: acknowledgments, explanations, commit
messages, review summaries. Code, commands, error text, and file paths stay byte-exact —
only the surrounding prose gets terse.

- Confirm it's active at the start of a session before doing non-trivial work.
- It is a standing mode, not a per-task toggle — once on, it stays on for the session.
- Applies to every skill in this repository equally: `nextjs-grill-me` and
  `nextjs-grill-output` benefit the most, since both are conversational by nature.
- On real agentic coding sessions, expect roughly single-digit to low-teens percent
  output-token reduction, because code, commands, and error text are already left
  untouched and only the surrounding narration compresses.
- Do not treat Caveman as the primary cost lever. In practice, unnecessary
  re-reading of files already in context is usually the bigger token cost driver
  than narration verbosity.

## Graphify — codebase-query compression

Graphify builds a queryable structure of the codebase (call graph, import graph, type
relationships) so the agent queries relationships instead of re-reading raw files to
orient itself.

- Rebuild the graph after structural changes — new features, renamed files, moved
  folders. A stale graph gives the agent wrong relationships, which costs more than no
  graph at all.
- Its value surface is large or unfamiliar codebases and cross-module architecture
  tracing, not small or already-known codebases doing targeted feature work.
- Keep it off by default on a fresh clone. Turn it on once the project has at least
  5 features under `features/`, or when someone new is onboarding into the
  codebase and needs relationship tracing more than local file familiarity.
- When in doubt whether the graph is current, check the graph's own timestamp/build log
  before trusting it over a direct file read.

---

## Session read cache — the actual biggest lever

Neither Caveman nor Graphify helps with this one; it's a discipline, not a tool, and
it costs more than both combined when skipped.

- Once you've read a doctrine or skill file this session (`template-invariants.md`,
  `clean-code-doctrine.md`, any `SKILL.md`), treat it as cached. Do not re-open it
  later in the same session on the assumption it "might have changed" — nothing in
  this repo rewrites itself mid-session. Re-read only if you yourself just edited it.
- `AGENTS.md` Step 1 says to skim `template-invariants.md` and `clean-code-doctrine.md`
  "for any code change." Read that as *first* code change this session, not every
  code change. By the third feature touched in one session, both should already be
  in context.
- Checking a single rule from a long `SKILL.md` (e.g. `nextjs-debugging` at 400+
  lines)? Grep for the heading or rule name first, read only that section. Don't
  reload the whole file to confirm one line.
- Large, mostly-mechanical work (bulk scaffolding, a multi-file generation pass,
  broad exploratory search across an unfamiliar area) belongs in a subagent/background
  task when your tooling supports one — it does the reading and writing in its own
  context, and only its summary lands back in yours. Keep the main thread for
  decisions, not for holding every file it took to reach them.

## Where this fits in the workflow

Read this file once per session, alongside `skills/START_HERE.md`. Don't re-verify tool
status mid-task — that itself burns the tokens this file is trying to save.

Both tools reduce cost per action; neither changes *when* an expensive action should
happen. Keep following the cadence in `skills/quality/nextjs-grill-output/SKILL.md`:
cheap mechanical checks run constantly, judgment-level passes run once per unit of work.
