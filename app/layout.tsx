import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/app/providers';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Web Starter',
  description: 'Production-ready Next.js starter template.',
};

/**
 * Root layout — Server Component. Carries only what every screen needs
 * regardless of auth state: providers and global styles. No sidebar/topbar
 * chrome here; that's added at the project layer (see
 * examples/app-modules/sample-shell for the pattern).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
