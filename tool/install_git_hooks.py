#!/usr/bin/env python3
"""Install a local pre-push git hook that runs the same checks as CI.

Usage:
    python tool/install_git_hooks.py

Run this once after cloning. It writes .git/hooks/pre-push, which runs
tool/pre_push_check.sh before every `git push` and blocks the push if any
check fails - the same checks .github/workflows/ci.yml runs, so a push
that reaches GitHub has already passed locally, instead of finding out
minutes later that CI is red.

Not tracked by git (.git/hooks/ is never committed) - every clone needs to
run this once. AGENTS.md/README.md both point here.
"""

from __future__ import annotations

import os
import stat
import subprocess
import sys
from pathlib import Path

HOOK_BODY = """#!/usr/bin/env bash
# Installed by tool/install_git_hooks.py - do not hand-edit, re-run that
# script to update this hook instead.
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"
if [ -f "$repo_root/tool/pre_push_check.sh" ]; then
  bash "$repo_root/tool/pre_push_check.sh"
else
  echo "tool/pre_push_check.sh not found - skipping pre-push checks." >&2
fi
"""


def main() -> int:
    try:
        root = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
    except subprocess.CalledProcessError:
        print("Not inside a git repository.", file=sys.stderr)
        return 1

    hooks_dir = Path(root) / ".git" / "hooks"
    hooks_dir.mkdir(parents=True, exist_ok=True)
    hook_path = hooks_dir / "pre-push"

    hook_path.write_text(HOOK_BODY)
    hook_path.chmod(hook_path.stat().st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)

    pre_push_check = Path(root) / "tool" / "pre_push_check.sh"
    if pre_push_check.exists():
        current = os.stat(pre_push_check)
        os.chmod(pre_push_check, current.st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)

    print(f"Installed pre-push hook at {hook_path}")
    print("Every `git push` now runs tool/pre_push_check.sh first and blocks on failure.")
    print("Skip once (not recommended) with: git push --no-verify")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
