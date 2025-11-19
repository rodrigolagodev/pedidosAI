'use client';

import type { Database } from '@/types/database';

type MembershipRole = Database['public']['Enums']['membership_role'];

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: MembershipRole[];
  userRole: MembershipRole;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user role.
 * Use this to show/hide UI elements based on permissions.
 *
 * @example
 * <RoleGate allowedRoles={['admin']} userRole={membership.role}>
 *   <button>Delete Organization</button>
 * </RoleGate>
 */
export function RoleGate({
  children,
  allowedRoles,
  userRole,
  fallback = null,
}: RoleGateProps) {
  if (!allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AdminOnlyProps {
  children: React.ReactNode;
  userRole: MembershipRole;
  fallback?: React.ReactNode;
}

/**
 * Convenience component that only shows content to admins.
 *
 * @example
 * <AdminOnly userRole={membership.role}>
 *   <button>Invite Members</button>
 * </AdminOnly>
 */
export function AdminOnly({
  children,
  userRole,
  fallback = null,
}: AdminOnlyProps) {
  return (
    <RoleGate allowedRoles={['admin']} userRole={userRole} fallback={fallback}>
      {children}
    </RoleGate>
  );
}
