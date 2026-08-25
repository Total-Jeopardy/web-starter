import { Home, Settings, Users } from 'lucide-react';

export interface SampleShellNavItem {
  label: string;
  href: string;
  icon: typeof Home;
}

/** Sample nav model — swap items/hrefs at the project layer, or delete this file if the shell isn't used. */
export const sampleShellNavItems: SampleShellNavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: Home },
  { label: 'Team', href: '/dashboard/team', icon: Users },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];
