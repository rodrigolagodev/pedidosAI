import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import MembersList, { Member, Invitation } from './members-list';
import type { Database } from '@/types/database';

type MembershipRole = Database['public']['Enums']['membership_role'];

export default async function MembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Get organization
  const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single();

  if (!org) {
    notFound();
  }

  // 2. Parallel fetch: User Role, Members, Invitations
  const [roleResult, membersResult, invitationsResult] = await Promise.all([
    // Get current user role
    supabase.rpc('get_user_role', {
      organization_id: org.id,
    }),

    // Get members
    supabase
      .from('memberships')
      .select('id, user_id, role, joined_at')
      .eq('organization_id', org.id)
      .order('joined_at', { ascending: true }),

    // Get pending invitations
    supabase
      .from('invitations')
      .select('id, email, role, created_at, expires_at')
      .eq('organization_id', org.id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
  ]);

  const userRole = (roleResult.data as MembershipRole) || 'member';
  const membersData = membersResult.data || [];
  const invitationsData = invitationsResult.data || [];

  // 3. Fetch profiles for members
  let members: Member[] = [];
  if (membersData.length > 0) {
    const userIds = membersData.map(m => m.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);

    members = membersData.map(m => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      created_at: m.joined_at,
      user: {
        email: m.user_id.slice(0, 8) + '...',
        full_name: profilesMap.get(m.user_id) || null,
      },
    }));
  }

  const invitations: Invitation[] = invitationsData.map(i => ({
    id: i.id,
    email: i.email,
    role: i.role,
    created_at: i.created_at,
    expires_at: i.expires_at,
  }));

  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Miembros</h2>
        <p className="mt-1 text-sm text-gray-600">Gestiona los miembros de tu organización</p>
      </div>

      <MembersList
        initialMembers={members}
        initialInvitations={invitations}
        organizationId={org.id}
        userRole={userRole}
      />
    </div>
  );
}
