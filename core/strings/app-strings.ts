/**
 * Central copy registry. Keep product-agnostic strings here; project-specific
 * copy belongs at the project layer, not in the template core.
 */
export const AppStrings = {
  common: {
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading…',
    somethingWentWrong: 'Something went wrong.',
  },
  emptyState: {
    defaultTitle: 'Nothing here yet',
    defaultDescription: 'There is no data to show right now.',
  },
  errorState: {
    defaultTitle: 'Unable to load this page',
    defaultDescription: 'Please check your connection and try again.',
  },
  auth: {
    login: 'Log in',
    logout: 'Log out',
    loginFailed: 'Could not log in with those credentials.',
  },
} as const;
