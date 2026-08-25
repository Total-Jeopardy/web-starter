# Template Upgrade Guide

How a project that already cloned `web-starter` pulls in later template
updates without losing project-specific changes.

## 1. Add the template as a remote (one-time)

```bash
git remote add template https://github.com/your-org/web-starter
git fetch template
```

## 2. Pull in template changes

```bash
git fetch template
git merge template/main --allow-unrelated-histories
```

Resolve conflicts favoring your project's changes in `app/`, `features/`,
and any file you've customized under `core/design-system/tokens.css`.
Template-owned files under `skills/` and `core/` (outside tokens) should
usually take the template's version unless you've deliberately diverged.

## 3. Check what changed

```bash
cat TEMPLATE_CHANGELOG.md
diff TEMPLATE_VERSION <(git show template/main:TEMPLATE_VERSION)
```

## 4. Re-run validation

```bash
python skills/scripts/validate_skills.py
python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red
npm run typecheck
npm run lint
npm run test
```

## Guidance

- Never let a project fork drift so far from `core/` that a future merge
  becomes impossible — if you must diverge, prefer overriding via the
  `custom_backend` slot or `examples/` promotion rather than editing
  `core/` files directly.
- If a merge conflict touches `skills/`, take the template's version unless
  you have specifically customized the doctrine for your project (rare —
  most projects should not fork skill content).
- Re-run `python tool/template_audit.py` after a merge to confirm the
  project still satisfies the purity checklist for anything that's supposed
  to stay generic.
