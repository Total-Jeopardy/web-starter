# Next.js DevOps Skill

> CI/CD pipelines, environment configuration, and release management for this template. AI follows this when setting up builds, configuring environments, or preparing releases.

## When To Use

Use this skill when changing CI, release commands, environment setup, or the definition of what must pass before merge or release.

Required references:
- `skills/scripts/validate_skills.py`
- `skills/build/nextjs-ui/scripts/nextjs_ui_audit.py`
- `skills/references/definition-of-done.md`
- `skills/references/clean-code-doctrine.md`

---

## Environment Configuration

### Never read `process.env` directly outside `core/config/app-config.ts`.

```bash
# Local dev
cp .env.example .env.local
# then edit .env.local with real values

npm run dev
```

### Reading env values in code

```typescript
// core/config/app-config.ts is the ONLY place process.env is read.
import { getAppConfig } from '@/core/config/app-config';

const config = getAppConfig();
console.log(config.apiBaseUrl);
```

### Required variables (see `.env.example`)

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Must be a valid URL |
| `NEXT_PUBLIC_ENV` | No (defaults `dev`) | `dev` \| `staging` \| `production` |
| `NEXT_PUBLIC_APP_PRESET` | No (defaults `no_auth`) | `no_auth` \| `backend_auth_sample` |
| `NEXT_PUBLIC_AUTH_PROVIDER` | No (defaults `none`) | `none` \| `reference_backend` \| `custom_backend` |
| `NEXT_PUBLIC_LOG_LEVEL` | No (defaults `info`) | `debug` \| `info` \| `warn` \| `error` |
| `NEXT_PUBLIC_REQUEST_ID_HEADER` | No (defaults `X-Request-Id`) | |
| `NEXT_PUBLIC_WS_URL` | No | Required only if a feature uses `skills/build/nextjs-realtime/SKILL.md` |
| `REMOTE_LOG_URL` | No | Server-only, no `NEXT_PUBLIC_` prefix — gates the remote logging sink |
| `REMOTE_LOG_BEARER_TOKEN` | No | Server-only — never reference from a `'use client'` file |

A missing required var fails fast with a clear Zod error at `getAppConfig()`'s first call — see `core/config/app-config.ts`. That's deliberate: better to fail on boot than deep inside a component.

---

## Per-Environment Config

Each environment (dev/staging/production) gets its own env var set — via `.env.local` locally, or the hosting provider's environment configuration in CI/deploy.

```bash
# .env.local (dev) — never committed
NEXT_PUBLIC_API_BASE_URL=https://dev.your-real-api-host
NEXT_PUBLIC_ENV=dev
```

```bash
# Staging/production — set via hosting provider dashboard or CI secrets, not committed files
NEXT_PUBLIC_API_BASE_URL=https://api.your-real-api-host
NEXT_PUBLIC_ENV=production
```

Never hardcode an API URL directly in a source file — always through `core/config/app-config.ts`.

---

## GitHub Actions CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_API_BASE_URL: https://ci.invalid  # CI-only placeholder
      NEXT_PUBLIC_ENV: dev
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: python skills/scripts/validate_skills.py
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
      - run: python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red
      - run: npm run build

  deploy:
    needs: validate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Deploy step is host-specific — see skills/ship/nextjs-platform/SKILL.md
```

---

## Pre-Commit / Pre-Push Gate

Run locally before pushing, matching what CI enforces:

```bash
npm run typecheck
npm run lint
npm run test
python skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red
python skills/scripts/validate_skills.py
```

---

## Release / Versioning

```json
// package.json
{
  "version": "1.2.3"
}
```

- Use semantic versioning for the app itself if it's versioned independently of deploys.
- Tag releases in git (`git tag v1.2.3`) if the deploy pipeline is tag-triggered.
- `TEMPLATE_VERSION` and `TEMPLATE_CHANGELOG.md` at the repo root track the *template's* own version — separate from the consuming project's app version. Do not conflate the two.

---

## Build Commands Reference

```bash
# Dev server
npm run dev

# Production build
npm run build

# Run the production build locally
npm run start

# Type-check without emitting
npm run typecheck

# Lint
npm run lint

# Run tests
npm run test

# Watch mode
npm run test:watch
```

---

## .gitignore Additions

```gitignore
# Env — NEVER commit
.env
.env.local
.env.*.local

# Build artifacts
.next/
node_modules/
```

---

## Anti-Patterns

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| Hardcode API URLs in source files | `core/config/app-config.ts` |
| Commit `.env.local` or any real secret | `.gitignore` + CI/host secrets |
| Read `process.env` outside `app-config.ts` | Route every env read through it |
| Skip `npm run typecheck`/`lint` in CI | Gate PRs on both passing |
| Add heavy CI before the template needs it | Start with lean validation + build jobs |
| Deploy without running `npm run build` locally first | Confirm the build succeeds before pushing to a branch that triggers deploy |

---

## DevOps Checklist

- [ ] API URLs use `core/config/app-config.ts` — not hardcoded
- [ ] `.env.local` and other real env files are in `.gitignore`
- [ ] CI runs skills validation, typecheck, lint, and test on every PR
- [ ] UI audit script runs in CI (`--only red` exits 1 on critical issues)
- [ ] `npm run build` succeeds before any deploy-triggering push
- [ ] Every var `core/config/app-config.ts` reads has a matching entry in `.env.example`
- [ ] Server-only secrets (`REMOTE_LOG_BEARER_TOKEN`) are never prefixed `NEXT_PUBLIC_`
- [ ] Target environment's `NEXT_PUBLIC_API_BASE_URL` is verified, not assumed, before deploy
