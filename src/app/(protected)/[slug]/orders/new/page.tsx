import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { NewOrderInitializer } from '@/features/orders/components/NewOrderInitializer';
import { getOrganizationBySlug } from '@/lib/auth/session';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function NewOrderPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get the organization from the slug to ensure we're in the right context
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  // Verify user has access to this organization
  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', organization.id)
    .single();

  if (!membership) {
    // User doesn't have access to this organization
    redirect('/');
  }

  // Return the client initializer which will create the local order
  return <NewOrderInitializer organizationId={organization.id} organizationSlug={slug} />;
}
