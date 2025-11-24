import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import { OrderChatInterface } from '@/features/orders/components/OrderChatInterface';

export default async function NewOrderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's organization
  // For MVP we assume single organization or pick first one
  // In real app, we might need an org switcher or context
  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id, organization:organizations(slug)')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!membership) {
    // Handle case where user has no organization
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-500">No Organization Found</h2>
        <p>Please contact support or create an organization.</p>
      </div>
    );
  }

  // Check if user has a recent draft order (created in last 24 hours)
  // If so, redirect to continue that conversation instead of creating a new one
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { data: recentDraft } = await supabase
    .from('orders')
    .select('id')
    .eq('organization_id', membership.organization_id)
    .eq('created_by', user.id)
    .eq('status', 'draft')
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // If user refreshed with a recent draft, redirect to continue it
  if (recentDraft) {
    redirect(`/orders/${recentDraft.id}`);
  }

  // We don't create the order immediately anymore (Lazy Creation)
  // We pass the organizationId so the context can create it when needed

  return (
    <OrderChatInterface
      orderId={null}
      initialMessages={[]}
      organizationSlug={membership.organization?.slug || ''}
      organizationId={membership.organization_id}
    />
  );
}
