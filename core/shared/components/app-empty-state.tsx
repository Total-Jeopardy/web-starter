import type { ReactNode } from 'react';
import { AppStrings } from '@/core/strings/app-strings';
import { cn } from '@/core/utils/cn';

export interface AppEmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Standard empty-state surface. Use this instead of an ad-hoc "no data" paragraph. */
export function AppEmptyState({
  title = AppStrings.emptyState.defaultTitle,
  description = AppStrings.emptyState.defaultDescription,
  icon,
  action,
  className,
}: AppEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center', className)}>
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
