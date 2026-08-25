/**
 * Default boot path — the starter home page. No login, no vendor SDK.
 * Enforced by test/architecture/template-defaults.test.ts.
 */
export default function StarterHomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Web Starter</h1>
      <p className="text-muted-foreground">
        This is the default, no-auth boot path. Start building your feature under{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm">features/</code>, or generate one with{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
          python skills/scripts/generate_feature_scaffold.py your-feature
        </code>
        .
      </p>
      <p className="text-sm text-muted-foreground">
        See <code className="rounded bg-muted px-1.5 py-0.5">skills/START_HERE.md</code> for the doctrine that governs
        this repo.
      </p>
    </main>
  );
}
