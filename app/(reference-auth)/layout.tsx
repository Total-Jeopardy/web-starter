import type { ReactNode } from 'react';

/**
 * Optional route group, only meaningfully reachable when
 * NEXT_PUBLIC_AUTH_PROVIDER=reference_backend. Minimal centered layout, no
 * chrome — consumes examples/reference-features/auth, owns no business
 * logic of its own.
 */
export default function ReferenceAuthLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-dvh items-center justify-center px-6">{children}</div>;
}
