import type { ReactNode } from 'react';
import { SampleShellTabs } from '@/examples/app-modules/sample-shell/sample-shell-tabs';

/**
 * Sample dashboard shell (sidebar + topbar + content frame) — the single
 * most commonly needed non-core piece across admin-style web projects.
 * Kept under `examples/` rather than `core/` so a project can delete or
 * heavily modify it without touching reusable architecture. Promote it into
 * a permanent project shell once it's product-specific.
 */
export function SampleShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-[16rem_1fr]">
      <aside className="border-r p-4">
        <div className="mb-6 px-3 text-lg font-semibold">Sample Shell</div>
        <SampleShellTabs />
      </aside>
      <div className="flex flex-col">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <span className="text-sm text-muted-foreground">Dashboard</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
