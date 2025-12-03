'use client';

import Link from 'next/link';
import { OrgSwitcher } from '@/components/auth/org-switcher';
import { UserMenu } from '@/components/auth/user-menu';
import type { TopBarProps } from './types';

export function TopBar({ organization, organizations, user }: TopBarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 bg-white border-b border-border shadow-nav-top z-top-nav"
      style={{ height: 'var(--top-bar-height)' }}
    >
      <div className="mx-auto max-w-app h-full px-4 flex items-center justify-between">
        {/* Logo - Left */}
        <Link
          href={`/${organization.slug}`}
          className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          Pedidos
        </Link>

        {/* Org Switcher + User Menu - Right */}
        <div className="flex items-center gap-3">
          <OrgSwitcher currentOrg={organization} organizations={organizations} compact />
          <UserMenu email={user.email} fullName={user.fullName} />
        </div>
      </div>
    </header>
  );
}
