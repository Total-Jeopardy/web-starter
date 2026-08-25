'use client';

import { create } from 'zustand';
import { Toast, type ToastProps } from '@/core/design-system/ui/toast';

interface ToastRecord {
  id: string;
  variant: ToastProps['variant'];
  title?: string | undefined;
  description?: string | undefined;
}

interface ToastStoreState {
  toasts: ToastRecord[];
  push: (toast: Omit<ToastRecord, 'id'>) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative toast API — call from anywhere: `appToast.error('Save failed')`. */
export const appToast = {
  success: (title: string, description?: string) => useToastStore.getState().push({ variant: 'success', title, description }),
  error: (title: string, description?: string) => useToastStore.getState().push({ variant: 'destructive', title, description }),
  info: (title: string, description?: string) => useToastStore.getState().push({ variant: 'default', title, description }),
};

/** Mount once near the root (see `app/providers.tsx`) to render the active toast stack. */
export function AppToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          onClose={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
}
