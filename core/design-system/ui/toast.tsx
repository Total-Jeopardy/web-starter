'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/core/utils/cn';

/**
 * Lightweight toast primitive (no Radix dependency — kept simple and
 * self-contained). Pair with `core/shared/components/app-toast.tsx` for the
 * app-level toast stack/hook.
 */
const toastVariants = cva(
  'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive: 'destructive group border-destructive bg-destructive text-destructive-foreground',
        success: 'border-transparent bg-primary text-primary-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  onClose?: (() => void) | undefined;
  title?: string | undefined;
  description?: string | undefined;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, title, description, onClose, ...props }, ref) => (
    <div ref={ref} role="status" className={cn(toastVariants({ variant }), className)} {...props}>
      <div className="grid gap-1">
        {title ? <p className="text-sm font-semibold">{title}</p> : null}
        {description ? <p className="text-sm opacity-90">{description}</p> : null}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  ),
);
Toast.displayName = 'Toast';

export { Toast, toastVariants };
