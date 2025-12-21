'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  inviteMember,
  removeMember,
  updateMemberRole,
  cancelInvitation,
} from '@/lib/organizations/actions';
import { AdminOnly } from '@/components/auth/role-gate';
import type { Database } from '@/types/database';

type MembershipRole = Database['public']['Enums']['membership_role'];

export interface Member {
  id: string;
  user_id: string;
  role: MembershipRole;
  created_at: string;
  user: {
    email: string;
    full_name: string | null;
  };
}

export interface Invitation {
  id: string;
  email: string;
  role: MembershipRole;
  created_at: string;
  expires_at: string;
}

interface MembersListProps {
  initialMembers: Member[];
  initialInvitations: Invitation[];
  organizationId: string;
  userRole: MembershipRole;
}

export default function MembersList({
  initialMembers,
  initialInvitations,
  organizationId,
  userRole,
}: MembersListProps) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MembershipRole>('member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invitationLink, setInvitationLink] = useState('');

  // We use the props as the initial source of truth.
  // When an action completes, we call router.refresh() to update the server data
  // and re-render this component with new props.
  // For immediate feedback, we could use local state, but for simplicity and correctness
  // with RSC, relying on props + refresh is a good start.
  // However, to avoid "flicker" or stale data while refreshing, we can assume the action succeeded.
  // But since we receive new props, we don't strictly need local state for the list *if* we trust refresh.
  // Let's stick to props for the list data.

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInvitationLink('');
    setInviting(true);

    const result = await inviteMember(organizationId, inviteEmail, inviteRole);

    if (!result.success) {
      setError(result.error || 'Error al enviar invitación');
    } else {
      const token = result.data?.invitationToken;
      if (token) {
        const link = `${window.location.origin}/invite/${token}`;
        setInvitationLink(link);
        setSuccess(`Invitación creada para ${inviteEmail}. Comparte el enlace de abajo.`);
      } else {
        setSuccess(`Invitación enviada a ${inviteEmail}`);
      }
      setInviteEmail('');
      router.refresh();
    }

    setInviting(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setSuccess('Enlace copiado al portapapeles');
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar a este miembro?')) {
      return;
    }

    const result = await removeMember(organizationId, userId);

    if (!result.success) {
      setError(result.error || 'Error al eliminar miembro');
    } else {
      setSuccess('Miembro eliminado');
      router.refresh();
    }
  }

  async function handleUpdateRole(userId: string, newRole: MembershipRole) {
    const result = await updateMemberRole(organizationId, userId, newRole);

    if (!result.success) {
      setError(result.error || 'Error al actualizar rol');
    } else {
      setSuccess('Rol actualizado');
      router.refresh();
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    const result = await cancelInvitation(invitationId);

    if (!result.success) {
      setError(result.error || 'Error al cancelar invitación');
    } else {
      setSuccess('Invitación cancelada');
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{success}</div>
      )}

      {invitationLink && (
        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800 mb-2">Enlace de invitación:</p>
          <div className="grid items-center gap-2">
            <input
              type="text"
              readOnly
              value={invitationLink}
              className="flex-1 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900"
            />
            <button
              onClick={() => copyToClipboard(invitationLink)}
              className="text-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Copiar
            </button>
            <a
              href={invitationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center rounded-md bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
            >
              Abrir
            </a>
          </div>
          <p className="mt-2 text-xs text-blue-600">
            Comparte este enlace con la persona que quieres invitar. Expira en 48 horas.
          </p>
        </div>
      )}

      {/* Invite form - only for admins */}
      <AdminOnly userRole={userRole}>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">Invitar miembro</h3>
          <form onSubmit={handleInvite} className="mt-4 space-y-4">
            <div className="grid gap-4">
              <div className="flex-1">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="role" className="sr-only">
                  Rol
                </label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as MembershipRole)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {inviting ? 'Enviando...' : 'Invitar'}
              </button>
            </div>
          </form>
        </div>
      </AdminOnly>

      {/* Current members */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Miembros actuales ({initialMembers.length})
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {initialMembers.map(member => (
            <li key={member.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-gray-900">{member.user.full_name || 'Sin nombre'}</p>
                <p className="text-sm text-gray-500">{member.user.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <AdminOnly userRole={userRole}>
                  <select
                    value={member.role}
                    onChange={e =>
                      handleUpdateRole(member.user_id, e.target.value as MembershipRole)
                    }
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="member">Miembro</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </AdminOnly>
                {userRole !== 'admin' && (
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    {member.role === 'admin' ? 'Admin' : 'Miembro'}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pending invitations - only for admins */}
      <AdminOnly userRole={userRole}>
        {initialInvitations.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Invitaciones pendientes ({initialInvitations.length})
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {initialInvitations.map(invitation => (
                <li
                  key={invitation.id}
                  className="grid gap-2 items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="font-medium text-gray-900 mb-2">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      Expira: {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                      {invitation.role === 'admin' ? 'Admin' : 'Miembro'}
                    </span>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Cancelar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AdminOnly>
    </div>
  );
}
