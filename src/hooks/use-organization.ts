'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type MembershipRole = Database['public']['Enums']['membership_role'];

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: MembershipRole;
  isAdmin: boolean;
}

export function useOrganization(slug: string) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function getOrganization() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError('No authenticated user');
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
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

        if (queryError || !data) {
          setError('Organization not found');
          setLoading(false);
          return;
        }

        const membership = Array.isArray(data.memberships)
          ? data.memberships.find((m) => m.user_id === user.id)
          : data.memberships;

        if (!membership) {
          setError('Not a member of this organization');
          setLoading(false);
          return;
        }

        setOrganization({
          id: data.id,
          name: data.name,
          slug: data.slug,
          role: membership.role,
          isAdmin: membership.role === 'admin',
        });
        setLoading(false);
      } catch {
        setError('Failed to load organization');
        setLoading(false);
      }
    }

    getOrganization();
  }, [slug]);

  return { organization, loading, error };
}

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function getOrganizations() {
      const { data, error } = await supabase.rpc('get_user_organizations');

      if (error || !data) {
        setOrganizations([]);
        setLoading(false);
        return;
      }

      setOrganizations(
        data.map((org) => ({
          id: org.organization_id,
          name: org.organization_name,
          slug: org.organization_slug,
          role: org.user_role,
          isAdmin: org.user_role === 'admin',
        }))
      );
      setLoading(false);
    }

    getOrganizations();
  }, []);

  return { organizations, loading };
}
