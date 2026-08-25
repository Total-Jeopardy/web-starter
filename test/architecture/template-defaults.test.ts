import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveAuthAdapter } from '@/core/auth/auth-providers';
import { NoAuthAdapter } from '@/core/auth/auth-adapter';

/**
 * Verifies the template's default boot path is genuinely the no-auth,
 * no-vendor, no-redirect path it claims to be — not just documented as such.
 * Each assertion here inspects real files or calls real code; none of them
 * are string-matching against a hope.
 */
const ROOT = path.resolve(__dirname, '..', '..');
const NO_AUTH_PAGE = path.join(ROOT, 'app', '(no-auth)', 'page.tsx');
const ENV_EXAMPLE = path.join(ROOT, '.env.example');
const CORE_DIR = path.join(ROOT, 'core');
const APP_DIR = path.join(ROOT, 'app');

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

describe('template defaults', () => {
  it('app/(no-auth)/page.tsx exists and is the default boot path', () => {
    expect(fs.existsSync(NO_AUTH_PAGE)).toBe(true);
    const contents = fs.readFileSync(NO_AUTH_PAGE, 'utf-8');
    expect(contents).toContain('export default function');

    // The default boot path must not redirect to a login screen — no
    // router.push('/login'), no redirect() call, no reference to a login
    // route at all.
    expect(contents).not.toMatch(/redirect\(/);
    expect(contents).not.toMatch(/router\.push\(['"]\/login['"]\)/);
    expect(contents).not.toContain("'/login'");
    expect(contents).not.toContain('"/login"');
  });

  it('.env.example documents NEXT_PUBLIC_APP_PRESET defaulting to no_auth', () => {
    const contents = fs.readFileSync(ENV_EXAMPLE, 'utf-8');
    expect(contents).toContain('NEXT_PUBLIC_APP_PRESET');
    // Must actually document the default semantics, not just declare the var.
    const presetLineIndex = contents.indexOf('NEXT_PUBLIC_APP_PRESET');
    const surrounding = contents.slice(Math.max(0, presetLineIndex - 200), presetLineIndex + 200);
    expect(surrounding).toMatch(/no_auth/);
    expect(surrounding).toMatch(/default/i);
    // And the assigned value in the example file itself must be the default.
    expect(contents).toMatch(/^NEXT_PUBLIC_APP_PRESET=no_auth$/m);
  });

  it('.env.example documents NEXT_PUBLIC_AUTH_PROVIDER defaulting to none', () => {
    const contents = fs.readFileSync(ENV_EXAMPLE, 'utf-8');
    expect(contents).toMatch(/^NEXT_PUBLIC_AUTH_PROVIDER=none$/m);
  });

  it("core/auth/auth-providers.ts really resolves 'none' to NoAuthAdapter", () => {
    const adapter = resolveAuthAdapter('none');
    expect(adapter).toBeInstanceOf(NoAuthAdapter);
  });

  it('NoAuthAdapter genuinely reports no session and refuses login (proves the default has no login path, not just no route)', async () => {
    const adapter = resolveAuthAdapter('none');
    const session = await adapter.checkSession();
    expect(session).toEqual({ ok: true, value: null });

    const loginResult = await adapter.login(undefined);
    expect(loginResult.ok).toBe(false);
  });

  it('no file under core/ or app/ hardcodes a vendor/brand name', () => {
    // Deny-list of vendor/brand strings that would indicate the template
    // core has been coupled to one specific product or auth vendor instead
    // of staying generic. Intentionally does NOT include "Web Starter" —
    // that is the template's own generic placeholder name, rewritten by
    // tool/rename_app.py, not a leaked brand.
    const DENY_LIST = [
      'Acme',
      'MyCompany',
      'Clerk',
      'Auth0',
      'Firebase',
      'Supabase',
      'Okta',
      'AWS Cognito',
    ];

    const files = [...walkFiles(CORE_DIR, ['.ts', '.tsx']), ...walkFiles(APP_DIR, ['.ts', '.tsx'])];
    const violations: string[] = [];

    for (const file of files) {
      const contents = fs.readFileSync(file, 'utf-8');
      for (const term of DENY_LIST) {
        if (contents.includes(term)) {
          violations.push(`${path.relative(ROOT, file)} contains '${term}'`);
        }
      }
    }

    expect(violations, violations.length > 0 ? violations.join('\n') : undefined).toEqual([]);
  });
});
