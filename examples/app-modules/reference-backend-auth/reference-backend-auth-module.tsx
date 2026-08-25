'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/examples/reference-features/auth/presentation/hooks/use-auth';
import { AppSkeleton } from '@/core/shared/components/app-skeleton';

/**
 * Optional wrapper module: mount this once (e.g. in a project's
 * authenticated layout) to trigger session restoration on load when
 * NEXT_PUBLIC_AUTH_PROVIDER=reference_backend. Not wired into the template
 * core by default — the default boot path is `(no-auth)`.
 */
export function ReferenceBackendAuthModule({ children }: { children: ReactNode }) {
  const { isRestoring } = useAuth();

  useEffect(() => {
    // useAuth() triggers restoration via its internal TanStack Query on mount.
  }, []);

  if (isRestoring) {
    return (
      <div className="p-6">
        <AppSkeleton lines={4} />
      </div>
    );
  }

  return <>{children}</>;
}
