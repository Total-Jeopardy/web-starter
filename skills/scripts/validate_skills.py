#!/usr/bin/env python3
"""Validate the Next.js skills operating layer for the web-starter template.

Parses skills/START_HERE.md and skills/SKILLS.md for every referenced
`skills/<path>/SKILL.md` file, checks each one exists on disk relative to the
repo root, and reports any that are missing (no orphaned references — a
reference to a SKILL.md that doesn't actually exist on disk).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKILLS_DIR = ROOT / "skills"
START_HERE = SKILLS_DIR / "START_HERE.md"
MASTER_INDEX = SKILLS_DIR / "SKILLS.md"

# Matches a backtick- or plain-text reference to a SKILL.md path, e.g.
# `skills/build/nextjs-ui/SKILL.md` or skills/build/nextjs-ui/SKILL.md
SKILL_PATH_RE = re.compile(r"skills/[A-Za-z0-9/_-]+/SKILL\.md")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def find_referenced_skill_paths(text: str) -> set[str]:
    return set(SKILL_PATH_RE.findall(text))


def main() -> int:
    errors: list[str] = []

    if not START_HERE.exists():
        print("ERROR: Missing skills/START_HERE.md", file=sys.stderr)
        return 1
    if not MASTER_INDEX.exists():
        print("ERROR: Missing skills/SKILLS.md", file=sys.stderr)
        return 1

    start_here_text = read(START_HERE)
    master_index_text = read(MASTER_INDEX)

    referenced: dict[str, list[str]] = {}
    for source_name, text in (("START_HERE.md", start_here_text), ("SKILLS.md", master_index_text)):
        for skill_path in find_referenced_skill_paths(text):
            referenced.setdefault(skill_path, []).append(source_name)

    if not referenced:
        errors.append(
            "No `skills/<path>/SKILL.md` references found in START_HERE.md or SKILLS.md — "
            "expected at least one."
        )

    missing: list[str] = []
    found: list[str] = []
    for skill_path in sorted(referenced):
        if (ROOT / skill_path).exists():
            found.append(skill_path)
        else:
            missing.append(skill_path)
            sources = ", ".join(referenced[skill_path])
            errors.append(f"Referenced but missing on disk: `{skill_path}` (referenced from {sources})")

    print(f"Checked {len(referenced)} referenced SKILL.md path(s): {len(found)} found, {len(missing)} missing.")

    if errors:
        print()
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    print("OK: every SKILL.md referenced from START_HERE.md/SKILLS.md exists on disk.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
