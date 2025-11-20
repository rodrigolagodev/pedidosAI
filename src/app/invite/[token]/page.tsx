import { getSession } from '@/lib/auth/session';
import { getInvitationByToken } from '@/lib/organizations/actions';
import { AcceptInvitationForm } from '@/components/auth/accept-invitation-form';
import Link from 'next/link';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export const metadata = {
  title: 'Invitación - Pedidos',
  description: 'Acepta la invitación para unirte a una organización',
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await getSession();

  // Get invitation details
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invitación no encontrada</h1>
          <p className="text-gray-600">
            Esta invitación no existe, ha expirado o ya fue utilizada.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  if (!invitation.is_valid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invitación expirada</h1>
          <p className="text-gray-600">
            Esta invitación ha expirado. Solicita una nueva invitación al administrador de{' '}
            <strong>{invitation.organization_name}</strong>.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  // If user is not logged in, show accept/reject options
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Te han invitado a {invitation.organization_name}
            </h1>
            <p className="mt-2 text-gray-600">
              {invitation.invited_by_name} te ha invitado como{' '}
              <strong>{invitation.role === 'admin' ? 'Administrador' : 'Miembro'}</strong>
            </p>
            <p className="mt-1 text-sm text-gray-500">Invitación para: {invitation.email}</p>
          </div>

          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600">¿Deseas unirte a este equipo?</p>

            <div className="flex flex-col gap-3">
              <Link
                href={`/register?email=${encodeURIComponent(invitation.email || '')}&invitation=${token}`}
                className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Aceptar invitación
              </Link>
              <Link
                href={`/invite/${token}/reject`}
                className="flex w-full justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Rechazar invitación
              </Link>
            </div>

            <p className="text-center text-xs text-gray-500">
              Al aceptar, crearás una cuenta y te unirás automáticamente al equipo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User is logged in, show accept form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Unirte a {invitation.organization_name}
          </h1>
          <p className="mt-2 text-gray-600">
            {invitation.invited_by_name} te ha invitado como{' '}
            <strong>{invitation.role === 'admin' ? 'Administrador' : 'Miembro'}</strong>
          </p>
        </div>

        <AcceptInvitationForm token={token} />
      </div>
    </div>
  );
}
