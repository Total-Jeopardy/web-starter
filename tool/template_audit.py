#!/usr/bin/env python3
"""Run lightweight structural/purity checks that keep the starter template generic.

Intended for CI: exits 0 when every check passes, 1 when any check fails,
printing a clear pass/fail report per check either way.

Usage:
    python tool/template_audit.py
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

NO_AUTH_PAGE = ROOT / "app" / "(no-auth)" / "page.tsx"
ENV_EXAMPLE = ROOT / ".env.example"
CORE_DIR = ROOT / "core"
EXAMPLES_DIR = ROOT / "examples"
VALIDATE_SKILLS_SCRIPT = ROOT / "skills" / "scripts" / "validate_skills.py"

# Deny-list of vendor/brand strings that should never leak into core/ — a
# generic template core must not be coupled to one specific auth vendor or
# company name. Deliberately excludes "Web Starter" itself, which is the
# template's own generic placeholder name (rewritten by tool/rename_app.py).
BRAND_DENY_LIST = (
    "Acme",
    "MyCompany",
    "Clerk",
    "Auth0",
    "Firebase",
    "Supabase",
    "Okta",
    "AWS Cognito",
)

IMPORT_SPECIFIER_RE = re.compile(r"""(?:from|import)\s*\(?\s*['"]([^'"]+)['"]""")


def walk_files(directory: Path, extensions: tuple[str, ...]) -> list[Path]:
    if not directory.exists():
        return []
    return [p for p in directory.rglob("*") if p.is_file() and p.suffix in extensions]


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class AuditResult:
    def __init__(self) -> None:
        self.checks: list[tuple[str, bool, str]] = []

    def record(self, name: str, passed: bool, detail: str = "") -> None:
        self.checks.append((name, passed, detail))

    @property
    def all_passed(self) -> bool:
        return all(passed for _, passed, _ in self.checks)


def check_default_boot_path(result: AuditResult) -> None:
    exists = NO_AUTH_PAGE.exists()
    result.record(
        "app/(no-auth)/page.tsx exists (default boot path present)",
        exists,
        "" if exists else f"missing {NO_AUTH_PAGE.relative_to(ROOT)}",
    )


def check_env_example_documents_auth_default(result: AuditResult) -> None:
    if not ENV_EXAMPLE.exists():
        result.record("NEXT_PUBLIC_AUTH_PROVIDER documented in .env.example", False, ".env.example is missing")
        return

    text = read(ENV_EXAMPLE)
    has_var = "NEXT_PUBLIC_AUTH_PROVIDER" in text
    matches_default = bool(re.search(r"^NEXT_PUBLIC_AUTH_PROVIDER=none$", text, re.MULTILINE))
    documents_none = "none" in text[max(0, text.find("NEXT_PUBLIC_AUTH_PROVIDER") - 200) : text.find("NEXT_PUBLIC_AUTH_PROVIDER") + 200]

    passed = has_var and matches_default and documents_none
    detail = ""
    if not passed:
        detail = "NEXT_PUBLIC_AUTH_PROVIDER must be present, default to none, and document that default"
    result.record("NEXT_PUBLIC_AUTH_PROVIDER defaults to none semantics in .env.example", passed, detail)


def check_no_hardcoded_brand_in_core(result: AuditResult) -> None:
    violations: list[str] = []
    for path in walk_files(CORE_DIR, (".ts", ".tsx")):
        text = read(path)
        for term in BRAND_DENY_LIST:
            if term in text:
                violations.append(f"{path.relative_to(ROOT)} contains '{term}'")

    passed = len(violations) == 0
    result.record(
        "core/ contains no hardcoded vendor/brand strings",
        passed,
        "; ".join(violations) if violations else "",
    )


def check_core_examples_separation(result: AuditResult) -> None:
    violations: list[str] = []
    for path in walk_files(CORE_DIR, (".ts", ".tsx")):
        text = read(path)
        for specifier in IMPORT_SPECIFIER_RE.findall(text):
            is_examples_import = specifier.startswith("@/examples/") or specifier == "@/examples"
            is_relative_examples_import = bool(re.match(r"^(\.\./)+", specifier)) and re.search(r"(^|/)examples/", specifier)
            if is_examples_import or is_relative_examples_import:
                violations.append(f"{path.relative_to(ROOT)} imports '{specifier}'")

    passed = len(violations) == 0
    result.record(
        "core/ and examples/ remain separate (no core/ file imports examples/)",
        passed,
        "; ".join(violations) if violations else "",
    )


def check_validate_skills_script_exists(result: AuditResult) -> None:
    exists = VALIDATE_SKILLS_SCRIPT.exists()
    result.record(
        "skills/scripts/validate_skills.py exists",
        exists,
        "" if exists else f"missing {VALIDATE_SKILLS_SCRIPT.relative_to(ROOT)}",
    )


def main() -> int:
    argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    ).parse_args()

    result = AuditResult()

    check_default_boot_path(result)
    check_env_example_documents_auth_default(result)
    check_no_hardcoded_brand_in_core(result)
    check_core_examples_separation(result)
    check_validate_skills_script_exists(result)

    print("Template audit report:")
    for name, passed, detail in result.checks:
        status = "PASS" if passed else "FAIL"
        line = f"  [{status}] {name}"
        if detail and not passed:
            line += f" — {detail}"
        print(line)

    if result.all_passed:
        print("\nTemplate audit passed.")
        return 0

    print("\nTemplate audit failed.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
