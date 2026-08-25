#!/usr/bin/env python3
"""Static Next.js/React UI audit for the web-starter skills.

This is intentionally lightweight: it catches repeatable UI-consistency
mistakes that are safe to detect with text scanning. AI review still handles
architectural intent. Mirrors the Flutter template's flutter_ui_audit.py.
"""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path

SCANNED_ROOTS = ("app", "core", "examples", "features")

# core/design-system/tokens.css is the one file allowed to define raw hex/hsl
# values -- everything else should route through the tokens it defines.
ALLOWED_HEX_FILES = {"tokens.css"}

HEX_COLOR_RE = re.compile(r"#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?\b")
CLASSNAME_ATTR_RE = re.compile(r"className\s*=\s*(\{[^{}]*\}|\"[^\"]*\"|'[^']*')")
STYLE_ATTR_RE = re.compile(r"style\s*=\s*\{\{([^{}]*)\}\}")
ARBITRARY_PX_RE = re.compile(r"\[(\d+(?:\.\d+)?)px\]")
SPINNER_SVG_RE = re.compile(r"<svg[^>]*\bclassName=(\"|')[^\"']*\banimate-spin\b")
SKELETON_IMPORT_RE = re.compile(r"\b(AppSkeleton|Skeleton)\b")


@dataclass(frozen=True)
class Finding:
    severity: str
    code: str
    path: Path
    line: int
    message: str


def iter_source_files(root: Path) -> list[Path]:
    if root.is_file() and root.suffix in (".ts", ".tsx"):
        return [root]

    ignored = {"node_modules", ".next", ".git", "dist", "build"}
    files: list[Path] = []

    if root.is_dir() and root.name in SCANNED_ROOTS:
        search_roots = [root]
    else:
        search_roots = [root / name for name in SCANNED_ROOTS if (root / name).is_dir()]
        if not search_roots and root.is_dir():
            # Fall back to scanning the whole given root if none of the
            # conventional top-level dirs exist under it (e.g. pointed
            # directly at a feature folder).
            search_roots = [root]

    for search_root in search_roots:
        for path in search_root.rglob("*"):
            if path.suffix not in (".ts", ".tsx"):
                continue
            if path.suffix == ".ts" and path.name.endswith(".d.ts"):
                continue
            if ignored.intersection(path.parts):
                continue
            files.append(path)

    return sorted(set(files))


def audit_file(path: Path) -> list[Finding]:
    findings: list[Finding] = []

    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = path.read_text(errors="ignore")

    lines = text.splitlines()

    for index, line in enumerate(lines, start=1):
        # --- Hardcoded hex colors in className / style, outside tokens.css ---
        if path.name not in ALLOWED_HEX_FILES:
            for attr_match in (*CLASSNAME_ATTR_RE.finditer(line), *_style_blocks(line)):
                snippet = attr_match if isinstance(attr_match, str) else attr_match.group(0)
                if HEX_COLOR_RE.search(snippet):
                    findings.append(
                        Finding(
                            "red",
                            "COLOR001",
                            path,
                            index,
                            "Hardcoded hex color in className/style. Use a design-token "
                            "Tailwind class (e.g. bg-primary, text-muted-foreground) instead.",
                        )
                    )

            # Catch a bare hex literal anywhere else in a .ts/.tsx file too
            # (e.g. assigned to a JS style object, a constant, inline SVG fill).
            if HEX_COLOR_RE.search(line) and "className" not in line and "style" not in line:
                # Skip comment-only lines and obvious non-color hex-looking tokens
                # (git hashes, ids) by requiring a color-ish context keyword nearby.
                if re.search(r"\b(color|background|fill|stroke|border)\b", line, re.IGNORECASE):
                    findings.append(
                        Finding(
                            "red",
                            "COLOR002",
                            path,
                            index,
                            "Hardcoded hex color outside core/design-system/tokens.css. "
                            "Route through a CSS-variable token instead.",
                        )
                    )

        # --- Arbitrary px values in Tailwind class names ---
        for px_match in ARBITRARY_PX_RE.finditer(line):
            if "className" in line or "cn(" in line:
                findings.append(
                    Finding(
                        "yellow",
                        "SPACING001",
                        path,
                        index,
                        f"Arbitrary pixel value [{px_match.group(1)}px] in a class name. "
                        "Prefer the Tailwind spacing scale or a design-system token.",
                    )
                )

        # --- Bare spinner-style loading indicators instead of Skeleton ---
        if SPINNER_SVG_RE.search(line):
            findings.append(
                Finding(
                    "red",
                    "LOADING001",
                    path,
                    index,
                    "Bare animate-spin <svg> used as a loading indicator. Use "
                    "AppSkeleton/Skeleton for known-shape loading content instead.",
                )
            )

    # --- File-level check: a component with loading-shaped state but no
    # Skeleton import is a weaker signal, surfaced only at --all verbosity ---
    if _looks_like_data_component(text) and not SKELETON_IMPORT_RE.search(text):
        findings.append(
            Finding(
                "yellow",
                "LOADING002",
                path,
                1,
                "Component reads isLoading/isPending but does not import "
                "AppSkeleton/Skeleton. Confirm the loading state is handled "
                "with the shared component, not an ad-hoc spinner.",
            )
        )

    return findings


def _style_blocks(line: str) -> list[str]:
    return [match.group(0) for match in STYLE_ATTR_RE.finditer(line)]


def _looks_like_data_component(text: str) -> bool:
    return bool(re.search(r"\bis(Loading|Pending|Fetching)\b", text)) and "'use client'" in text


def main() -> int:
    parser = argparse.ArgumentParser(description="Static UI-consistency audit for the web-starter template.")
    parser.add_argument("path", nargs="?", default=".", help="File or directory to scan (default: current directory)")
    parser.add_argument("--only", choices=("red", "yellow"), default=None, help="Show only findings of this severity")
    parser.add_argument("--all", action="store_true", help="Show all findings, including lower-confidence yellow ones")
    args = parser.parse_args()

    root = Path(args.path)
    findings: list[Finding] = []
    for source_file in iter_source_files(root):
        findings.extend(audit_file(source_file))

    if args.only:
        findings = [finding for finding in findings if finding.severity == args.only]
    elif not args.all:
        # Default view: red (critical) always shown, yellow shown too but
        # trimmed of the lowest-confidence file-level heuristic.
        findings = [f for f in findings if not (f.severity == "yellow" and f.code == "LOADING002")]

    if not findings:
        print("🟢 OK: no matching Next.js UI audit findings.")
        return 0

    severity_emoji = {"red": "🔴", "yellow": "🟡"}
    for finding in sorted(findings, key=lambda f: (str(f.path), f.line)):
        emoji = severity_emoji.get(finding.severity, "🟢")
        print(f"{emoji} {finding.severity.upper()} {finding.code} {finding.path}:{finding.line} - {finding.message}")

    red_count = sum(1 for f in findings if f.severity == "red")
    yellow_count = sum(1 for f in findings if f.severity == "yellow")
    print(f"\n{red_count} critical, {yellow_count} warning finding(s).")

    return 1 if red_count > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
