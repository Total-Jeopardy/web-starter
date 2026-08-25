'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeModeProvider } from '@/core/design-system/theme-mode-provider';
import { AppToastViewport } from '@/core/shared/components/app-toast';

/**
 * Composition root for every Client-Component-only context: TanStack Query,
 * theme mode, and the toast viewport. Kept separate from `app/layout.tsx`
 * (a Server Component) so the server/client boundary is explicit rather
 * than defaulted — see skills/build/nextjs-architecture/SKILL.md.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        {children}
        <AppToastViewport />
      </ThemeModeProvider>
    </QueryClientProvider>
  );
}
