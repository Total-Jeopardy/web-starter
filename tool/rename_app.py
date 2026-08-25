#!/usr/bin/env python3
"""Rename this template's display name and npm package name in one pass.

Run once, right after cloning, before you start customizing the app — before
that, everything still says "Web Starter" / "web-starter".

Usage:
    python tool/rename_app.py --app-name "My App" --package-name my-app

Updates:
    - package.json `name` field
    - app/layout.tsx `metadata.title`
    - app/(no-auth)/page.tsx <h1> display string

Idempotent-safe: running the script twice with the same arguments leaves the
files unchanged the second time (it replaces the *current* title/name found
in each file with the new one, whatever that current value is).
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON = ROOT / "package.json"
LAYOUT_TSX = ROOT / "app" / "layout.tsx"
HOME_PAGE_TSX = ROOT / "app" / "(no-auth)" / "page.tsx"


def validate_package_name(name: str) -> None:
    # Mirrors npm's own package name rules (lowercase, URL-safe, optionally
    # scoped) closely enough to catch the common mistakes early.
    if not re.fullmatch(r"(@[a-z0-9-][a-z0-9-_.]*/)?[a-z0-9-][a-z0-9-_.]*", name):
        raise SystemExit(
            f"--package-name must be a valid npm package name (lowercase, "
            f"URL-safe), got: {name!r}"
        )


def rename_package_json(package_name: str) -> str:
    text = PACKAGE_JSON.read_text(encoding="utf-8")
    new_text, count = re.subn(
        r'("name"\s*:\s*)"[^"]*"', rf'\1"{package_name}"', text, count=1
    )
    if count == 0:
        raise SystemExit(f'could not find a "name" field in {PACKAGE_JSON}')
    PACKAGE_JSON.write_text(new_text, encoding="utf-8")
    return PACKAGE_JSON.relative_to(ROOT).as_posix()


def rename_layout_title(app_name: str) -> str:
    text = LAYOUT_TSX.read_text(encoding="utf-8")
    new_text, count = re.subn(
        r"(title:\s*)'[^']*'", rf"\1'{app_name}'", text, count=1
    )
    if count == 0:
        raise SystemExit(f"could not find `title: '...'` in {LAYOUT_TSX}")
    LAYOUT_TSX.write_text(new_text, encoding="utf-8")
    return LAYOUT_TSX.relative_to(ROOT).as_posix()


def rename_home_page_heading(app_name: str) -> str:
    text = HOME_PAGE_TSX.read_text(encoding="utf-8")
    new_text, count = re.subn(
        r"(<h1[^>]*>)([^<]*)(</h1>)", rf"\g<1>{app_name}\g<3>", text, count=1
    )
    if count == 0:
        raise SystemExit(f"could not find an <h1> heading in {HOME_PAGE_TSX}")
    HOME_PAGE_TSX.write_text(new_text, encoding="utf-8")
    return HOME_PAGE_TSX.relative_to(ROOT).as_posix()


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--app-name", required=True, help='Display name, e.g. "My App"')
    parser.add_argument(
        "--package-name",
        required=True,
        help='npm package name, e.g. "my-app" or "@myorg/my-app"',
    )
    args = parser.parse_args()

    validate_package_name(args.package_name)

    changed = [
        rename_package_json(args.package_name),
        rename_layout_title(args.app_name),
        rename_home_page_heading(args.app_name),
    ]

    print(f"Renamed to: app_name={args.app_name!r} package_name={args.package_name!r}")
    for path in changed:
        print(f"  updated {path}")
    print("Next: `npm install`, then `npm run typecheck` to confirm nothing broke.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
