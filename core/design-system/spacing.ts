/** Spacing scale tokens, mirrored in tailwind.config.ts via CSS variables. Avoid magic px/rem in feature code. */
export const AppSpacing = {
  xs: 'var(--space-xs)',
  sm: 'var(--space-sm)',
  md: 'var(--space-md)',
  lg: 'var(--space-lg)',
  xl: 'var(--space-xl)',
  '2xl': 'var(--space-2xl)',
} as const;
