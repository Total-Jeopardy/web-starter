import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Enforces the template's core purity invariant: `core/` must stay
 * leaf/product-agnostic. Nothing under it may import from `features/`,
 * `examples/`, or `app/` — those layers depend on core, never the reverse.
 *
 * Implemented with plain `fs`/regex parsing (no AST dependency) so this test
 * has zero extra tooling cost — see skills/quality/nextjs-testing/SKILL.md.
 */
const ROOT = path.resolve(__dirname, '..', '..');
const CORE_DIR = path.join(ROOT, 'core');
const FORBIDDEN_SEGMENTS = ['features', 'examples', 'app'];

// Matches `from '...'`, `from "..."`, and bare `import('...')` specifiers.
const IMPORT_SPECIFIER_RE = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;

function walkFiles(dir: string, extensions: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractImportSpecifiers(fileContents: string): string[] {
  const specifiers: string[] = [];
  let match: RegExpExecArray | null;
  IMPORT_SPECIFIER_RE.lastIndex = 0;
  while ((match = IMPORT_SPECIFIER_RE.exec(fileContents)) !== null) {
    const specifier = match[1];
    if (specifier !== undefined) specifiers.push(specifier);
  }
  return specifiers;
}

/** True if an import specifier reaches into one of the forbidden top-level dirs. */
function violatesBoundary(specifier: string, forbiddenSegments: string[]): string | null {
  for (const segment of forbiddenSegments) {
    // Absolute alias form: '@/features/...', '@/examples/...', '@/app/...'
    if (specifier.startsWith(`@/${segment}/`) || specifier === `@/${segment}`) {
      return segment;
    }
    // Relative form: '../features/...', '../../app/...', etc.
    if (/^(\.\.\/)+/.test(specifier) && new RegExp(`(^|/)${segment}/`).test(specifier)) {
      return segment;
    }
  }
  return null;
}

interface Violation {
  file: string;
  specifier: string;
  segment: string;
}

function findCoreBoundaryViolations(): Violation[] {
  const files = walkFiles(CORE_DIR, ['.ts', '.tsx']);
  const violations: Violation[] = [];

  for (const file of files) {
    const contents = fs.readFileSync(file, 'utf-8');
    for (const specifier of extractImportSpecifiers(contents)) {
      const segment = violatesBoundary(specifier, FORBIDDEN_SEGMENTS);
      if (segment) {
        violations.push({ file: path.relative(ROOT, file), specifier, segment });
      }
    }
  }

  return violations;
}

describe('core import boundary', () => {
  it('does not import from features/, examples/, or app/', () => {
    const violations = findCoreBoundaryViolations();

    expect(
      violations,
      violations.length > 0
        ? `Core import boundary violations found:\n${violations
            .map((v) => `  ${v.file} imports '${v.specifier}' (forbidden: ${v.segment}/)`)
            .join('\n')}`
        : undefined,
    ).toEqual([]);
  });

  it('canary: actually walks real files under core/ (the check is not a no-op)', () => {
    const files = walkFiles(CORE_DIR, ['.ts', '.tsx']);
    // If this is ever 0, the walker is broken (wrong path, core/ moved, etc.)
    // and the boundary check above would be silently vacuous.
    expect(files.length).toBeGreaterThan(5);

    // Sanity-check the regex/violation logic itself, independent of real
    // files, so a future refactor of the matcher can't quietly disable it.
    expect(violatesBoundary('@/features/foo/bar', FORBIDDEN_SEGMENTS)).toBe('features');
    expect(violatesBoundary('@/examples/reference-features/auth', FORBIDDEN_SEGMENTS)).toBe('examples');
    expect(violatesBoundary('@/app/providers', FORBIDDEN_SEGMENTS)).toBe('app');
    expect(violatesBoundary('../../features/x', FORBIDDEN_SEGMENTS)).toBe('features');
    expect(violatesBoundary('@/core/network/api-client', FORBIDDEN_SEGMENTS)).toBeNull();
    expect(violatesBoundary('zustand', FORBIDDEN_SEGMENTS)).toBeNull();
  });
});
