import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { TopBar, BottomNavBar } from '@/components/navigation';
import {
  getSessionOrRedirect,
  getUserOrganizations,
  getOrganizationBySlug,
} from '@/lib/auth/session';

export default async function OrderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionOrRedirect();
  const supabase = await createClient();

  // Fetch order to get organization slug
  const { data: order } = await supabase
    .from('orders')
    .select('organization:organizations(slug)')
    .eq('id', id)
    .single();

  let organization;

  if (order?.organization) {
    organization = await getOrganizationBySlug(order.organization.slug);
  } else {
    // Fallback: If order not found (local draft), use the user's first organization
    // This assumes the user is creating an order for their primary/first org
    const organizations = await getUserOrganizations();
    if (organizations.length > 0) {
      organization = organizations[0];
    }
  }

  const allOrganizations = await getUserOrganizations();

  if (!organization) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        organization={organization}
        organizations={allOrganizations}
        user={{
          email: session.email,
          fullName: session.fullName,
        }}
      />

      <main
        className="mx-auto max-w-app px-4 py-6"
        style={{
          paddingTop: 'calc(var(--top-bar-height) + 1.5rem)',
          paddingBottom: 'calc(var(--bottom-nav-height) + 1.5rem)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </main>

      <BottomNavBar
        currentPath={`/orders/${id}`}
        organizationSlug={organization.slug}
        isAdmin={organization.isAdmin}
      />
    </div>
  );
}
