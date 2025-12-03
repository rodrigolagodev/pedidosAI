'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { FloatingActionButtonProps } from './types';

/**
 * Routes where the FAB should be visible
 * FAB is hidden on:
 * - Order creation/editing pages (would be redundant)
 * - Settings pages (not contextually relevant)
 * - Supplier detail/edit pages (different primary action)
 */
const VISIBLE_ROUTES = [
  /^\/[^/]+$/, // Dashboard: /org-slug
  /^\/[^/]+\/history/, // History: /org-slug/history
  /^\/[^/]+\/suppliers$/, // Suppliers list: /org-slug/suppliers
  /^\/[^/]+\/settings\/members$/, // Team: /org-slug/settings/members
];

export function FloatingActionButton({}: FloatingActionButtonProps) {
  const pathname = usePathname();

  // Determine if FAB should be visible
  const isVisible = VISIBLE_ROUTES.some(pattern => pattern.test(pathname));

  if (!isVisible) {
    return null;
  }

  // Extract organization slug from current path
  // Pathname format: /org-slug/... or /org-slug
  const pathSegments = pathname.split('/').filter(Boolean);
  const orgSlug = pathSegments[0] || '';

  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={`/${orgSlug}/orders/new` as any}
      className="fixed bottom-[calc(var(--bottom-nav-height)+1rem)] right-4 z-fab
        w-16 h-16 
        flex items-center justify-center
        rounded-full 
        bg-primary hover:bg-primary/90
        text-primary-foreground
        shadow-fab hover:shadow-lg
        transition-all duration-200
        active:scale-95
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label="Crear nuevo pedido"
    >
      <PlusIcon className="h-7 w-7" strokeWidth={2.5} />
      <span className="sr-only">Crear nuevo pedido</span>
    </Link>
  );
}
