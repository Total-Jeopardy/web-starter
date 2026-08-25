import type { ReactNode } from 'react';

/**
 * Default boot path layout — Server Component. Minimal, no sidebar/topbar.
 * Mirrors the Flutter template's `lib/app/modules/no_auth/`.
 */
export default function NoAuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
