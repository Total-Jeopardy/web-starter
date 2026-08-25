import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional class names and resolves conflicting Tailwind utility
 * classes (e.g. `px-2` vs `px-4`) in favor of the last one applied.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
