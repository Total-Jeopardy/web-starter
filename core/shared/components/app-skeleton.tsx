import { Skeleton } from '@/core/design-system/ui/skeleton';
import { cn } from '@/core/utils/cn';

export interface AppSkeletonProps {
  /** Number of skeleton lines to render for a text-block loading state. */
  lines?: number;
  className?: string;
}

/**
 * Standard loading placeholder. Use this for in-page loading — never a
 * bare full-screen spinner for content that has a known shape.
 */
export function AppSkeleton({ lines = 3, className }: AppSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn('h-4', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function AppSkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 rounded-lg border p-4', className)}>
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}
