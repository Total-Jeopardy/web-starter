/**
 * Declares access rules per route group. `middleware.ts` and any project
 * route guard consult this instead of hardcoding path checks inline, so
 * there is one source of truth for "which routes need a session."
 */
export type RouteAccess = 'public' | 'guestOnly' | 'authenticated';

export interface RouteAccessRule {
  /** Path prefix, matched with startsWith — e.g. "/dashboard". */
  prefix: string;
  access: RouteAccess;
}

/**
 * The template ships no authenticated route groups by default (the default
 * boot path is `(no-auth)`), so this starts empty. A project adds its own
 * authenticated route groups here once it introduces them.
 */
export const routeAccessRegistry: RouteAccessRule[] = [
  { prefix: '/login', access: 'guestOnly' },
];

export function accessForPath(pathname: string): RouteAccess {
  const rule = routeAccessRegistry.find((r) => pathname.startsWith(r.prefix));
  return rule?.access ?? 'public';
}
