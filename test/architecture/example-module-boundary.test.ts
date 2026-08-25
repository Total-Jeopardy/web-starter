import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Documents and enforces the examples isolation invariant:
 *
 *  1. `core/` never imports from `examples/` (core stays example-agnostic —
 *     a subset of the broader check in core-import-boundary.test.ts, kept
 *     here as its own named invariant since it's the one most likely to be
 *     violated by someone "just wiring the reference adapter in for
 *     convenience").
 *  2. `app/(no-auth)/` — the default boot path — never imports from
 *     `examples/reference-features/auth`. That reference feature must only
 *     be reachable from `app/(reference-auth)/`, so a project that never
 *     opts into the reference backend never ships its code in the default
 *     boot path.
 */
const ROOT = path.resolve(__dirname, '..', '..');
const CORE_DIR = path.join(ROOT, 'core');
const NO_AUTH_APP_DIR = path.join(ROOT, 'app', '(no-auth)');

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

interface Violation {
  file: string;
  specifier: string;
}

function findImportsMatching(dir: string, extensions: string[], isForbidden: (specifier: string) => boolean): Violation[] {
  const files = walkFiles(dir, extensions);
  const violations: Violation[] = [];
  for (const file of files) {
    const contents = fs.readFileSync(file, 'utf-8');
    for (const specifier of extractImportSpecifiers(contents)) {
      if (isForbidden(specifier)) {
        violations.push({ file: path.relative(ROOT, file), specifier });
      }
    }
  }
  return violations;
}

function isExamplesImport(specifier: string): boolean {
  if (specifier.startsWith('@/examples/') || specifier === '@/examples') return true;
  if (/^(\.\.\/)+/.test(specifier) && /(^|\/)examples\//.test(specifier)) return true;
  return false;
}

function isReferenceAuthImport(specifier: string): boolean {
  if (specifier.includes('@/examples/reference-features/auth')) return true;
  if (/^(\.\.\/)+/.test(specifier) && specifier.includes('examples/reference-features/auth')) return true;
  return false;
}

describe('example module boundary', () => {
  it('core/ does not import from examples/', () => {
    const violations = findImportsMatching(CORE_DIR, ['.ts', '.tsx'], isExamplesImport);

    expect(
      violations,
      violations.length > 0
        ? `core/ must not import examples/:\n${violations.map((v) => `  ${v.file} imports '${v.specifier}'`).join('\n')}`
        : undefined,
    ).toEqual([]);
  });

  it('app/(no-auth)/ does not import examples/reference-features/auth', () => {
    const files = walkFiles(NO_AUTH_APP_DIR, ['.ts', '.tsx']);
    // Canary: confirm the walker found the default boot path's files at all,
    // otherwise this check would pass vacuously if the directory ever moved.
    expect(files.length).toBeGreaterThan(0);

    const violations = findImportsMatching(NO_AUTH_APP_DIR, ['.ts', '.tsx'], isReferenceAuthImport);

    expect(
      violations,
      violations.length > 0
        ? `app/(no-auth)/ must not import examples/reference-features/auth (default boot path must stay auth-free):\n${violations
            .map((v) => `  ${v.file} imports '${v.specifier}'`)
            .join('\n')}`
        : undefined,
    ).toEqual([]);
  });
});
