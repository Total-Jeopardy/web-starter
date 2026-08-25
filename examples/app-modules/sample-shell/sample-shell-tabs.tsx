'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/core/utils/cn';
import { sampleShellNavItems } from '@/examples/app-modules/sample-shell/sample-shell-nav';

/** Sidebar tab list — highlights the active route by prefix match. */
export function SampleShellTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {sampleShellNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
