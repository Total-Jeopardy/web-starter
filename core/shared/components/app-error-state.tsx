import { AlertCircle } from 'lucide-react';
import { Button } from '@/core/design-system/ui/button';
import { AppStrings } from '@/core/strings/app-strings';
import { cn } from '@/core/utils/cn';

export interface AppErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/** Standard error-state surface for a failed data fetch. Pairs with `AppEmptyState`/`AppSkeleton`. */
export function AppErrorState({
  title = AppStrings.errorState.defaultTitle,
  description = AppStrings.errorState.defaultDescription,
  onRetry,
  className,
}: AppErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center', className)}
    >
      <AlertCircle className="h-8 w-8 text-destructive" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {AppStrings.common.retry}
        </Button>
      ) : null}
    </div>
  );
}
