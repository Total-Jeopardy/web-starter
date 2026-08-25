#!/usr/bin/env bash
# Runs the exact same checks as .github/workflows/ci.yml's `validate` job,
# locally, before a push leaves this machine. Mirrors CI step-for-step so
# "passes locally" and "passes in CI" mean the same thing - drift between
# the two is what caused repeated CI failures that looked fine locally.
#
# Installed as .git/hooks/pre-push by tool/install_git_hooks.py. Run it
# directly any time with: bash tool/pre_push_check.sh

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-https://ci.example.com}"
export NEXT_PUBLIC_ENV="${NEXT_PUBLIC_ENV:-dev}"
export NEXT_PUBLIC_APP_PRESET="${NEXT_PUBLIC_APP_PRESET:-no_auth}"
export NEXT_PUBLIC_AUTH_PROVIDER="${NEXT_PUBLIC_AUTH_PROVIDER:-none}"
export NEXT_PUBLIC_LOG_LEVEL="${NEXT_PUBLIC_LOG_LEVEL:-info}"
export NEXT_PUBLIC_REQUEST_ID_HEADER="${NEXT_PUBLIC_REQUEST_ID_HEADER:-X-Request-Id}"

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$1"; }
fail() { printf '\n\033[1;31m✗ %s\033[0m\n' "$1"; exit 1; }

step "Validate skills"
python3 skills/scripts/validate_skills.py || fail "validate_skills.py failed"

step "Run template audit"
python3 tool/template_audit.py || fail "template_audit.py failed"

step "Install dependencies (npm ci)"
npm ci || fail "npm ci failed"

step "Typecheck"
npm run typecheck || fail "typecheck failed"

step "Lint"
npm run lint || fail "lint failed"

step "Run UI audit (critical only)"
python3 skills/build/nextjs-ui/scripts/nextjs_ui_audit.py . --only red || fail "UI audit found critical issues"

step "Run tests"
npm run test || fail "tests failed"

step "Build"
npm run build || fail "build failed - note this uses the same CI env vars above, not your .env.local"

printf '\n\033[1;32m✓ All checks passed - matches what CI will run.\033[0m\n'
