/**
 * Central registry of client-cache keys so features don't invent ad-hoc
 * string literals that collide or drift. Add project keys here, namespaced
 * `feature.thing`.
 */
export const AppStorageKeys = {
  themeMode: 'app.theme_mode',
  sidebarCollapsed: 'app.sidebar_collapsed',
} as const;

export type AppStorageKey = (typeof AppStorageKeys)[keyof typeof AppStorageKeys];
