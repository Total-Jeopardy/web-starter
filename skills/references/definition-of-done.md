# Definition Of Done

A change is not done in this template unless all of these are true:

- correct skill paths were used for the task
- `npm run typecheck` passes
- `npm run lint` passes
- `python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red` passes for UI work
- tests were added when feature logic, routing, security, or state behavior changed
- each non-trivial use-case has direct unit coverage
- no template invariant from `skills/references/template-invariants.md` was broken
- no god components or mixed-responsibility files were introduced
- function and use-case names are intention-revealing and verb-based where appropriate
- Server vs Client Component boundary is explicit and correct
- final review used `skills/quality/nextjs-code-review/SKILL.md`
