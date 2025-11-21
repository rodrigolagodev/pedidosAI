import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import type { MembershipRole } from '@/types/helpers';

export interface UserSession {
  id: string;
  email: string;
  fullName: string | null;
}

export interface OrganizationContext {
  id: string;
  name: string;
  slug: string;
  role: MembershipRole;
  isAdmin: boolean;
}

/**
 * Get the current authenticated user session
 * Returns null if not authenticated
 */
export async function getSession(): Promise<UserSession | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    fullName: profile?.full_name ?? null,
  };
}

/**
 * Get the current user or redirect to login
 */
export async function getSessionOrRedirect(): Promise<UserSession> {
  const session = await getSession();

  if (!session) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect('/login' as any);
  }

  return session;
}

/**
 * Get the current authenticated user (Supabase User object)
 */
export async function getUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get all organizations for the current user
 */
export async function getUserOrganizations(): Promise<OrganizationContext[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_user_organizations');

  if (error || !data) {
    return [];
  }

  return data.map((org) => ({
    id: org.organization_id,
    name: org.organization_name,
    slug: org.organization_slug,
    role: org.user_role,
    isAdmin: org.user_role === 'admin',
  }));
}

/**
 * Get organization context by slug
 */
export async function getOrganizationBySlug(
  slug: string
): Promise<OrganizationContext | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select(
      `
      id,
      name,
      slug,
      memberships!inner (
        role,
        user_id
      )
    `
    )
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  // Get the membership for the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const membership = Array.isArray(data.memberships)
    ? data.memberships.find((m) => m.user_id === user.id)
    : data.memberships;

  if (!membership) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    role: membership.role,
    isAdmin: membership.role === 'admin',
  };
}

/**
 * Get user's role in a specific organization
 */
export async function getUserRole(
  organizationId: string
): Promise<MembershipRole | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_user_role', {
    organization_id: organizationId,
  });

  if (error) {
    return null;
  }

  return data;
}

/**
 * Check if user is admin of organization
 */
export async function isUserAdmin(organizationId: string): Promise<boolean> {
  const role = await getUserRole(organizationId);
  return role === 'admin';
}

/**
 * Get the default organization for the user (first one joined)
 */
export async function getDefaultOrganization(): Promise<OrganizationContext | null> {
  const organizations = await getUserOrganizations();

  if (organizations.length === 0) {
    return null;
  }

  return organizations[0] ?? null;
}
