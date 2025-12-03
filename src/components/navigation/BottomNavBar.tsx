'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, DocumentTextIcon, TruckIcon, UsersIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  TruckIcon as TruckIconSolid,
  UsersIcon as UsersIconSolid,
} from '@heroicons/react/24/solid';
import type { BottomNavBarProps } from './types';

export function BottomNavBar({ organizationSlug, isAdmin }: BottomNavBarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      id: 'home',
      label: 'Inicio',
      href: `/${organizationSlug}`,
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
      pattern: new RegExp(`^/${organizationSlug}$`),
    },
    {
      id: 'orders',
      label: 'Pedidos',
      href: `/${organizationSlug}/history`,
      icon: DocumentTextIcon,
      activeIcon: DocumentTextIconSolid,
      pattern: new RegExp(`^/${organizationSlug}/history`),
    },
    {
      id: 'suppliers',
      label: 'Proveedores',
      href: `/${organizationSlug}/suppliers`,
      icon: TruckIcon,
      activeIcon: TruckIconSolid,
      pattern: new RegExp(`^/${organizationSlug}/suppliers`),
    },
    {
      id: 'team',
      label: 'Equipo',
      href: `/${organizationSlug}/settings/members`,
      icon: UsersIcon,
      activeIcon: UsersIconSolid,
      pattern: new RegExp(`^/${organizationSlug}/settings`),
      adminOnly: true,
    },
  ];

  // Filter out admin-only items if user is not admin
  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-nav-bottom z-bottom-nav"
      style={{ height: 'var(--bottom-nav-height)' }}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="mx-auto max-w-app h-full">
        <div
          className="grid h-full"
          style={{ gridTemplateColumns: `repeat(${visibleItems.length}, 1fr)` }}
        >
          {visibleItems.map(item => {
            const isActive = item.pattern.test(pathname);
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <Link
                key={item.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={item.href as any}
                className={`flex flex-col items-center justify-center gap-1 transition-colors pb-4 pt-3 ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
