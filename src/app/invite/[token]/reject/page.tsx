'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { rejectInvitation } from '@/lib/organizations/actions';

export default function RejectInvitationPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    async function reject() {
      const result = await rejectInvitation(token);

      if (result.success) {
        setStatus('success');
      } else {
        setError(result.error || 'Error al rechazar la invitación');
        setStatus('error');
      }
    }

    reject();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600">Procesando...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
          <a
            href="/"
            className="inline-block text-sm text-blue-600 hover:text-blue-500"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="rounded-md bg-gray-100 p-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Invitación rechazada
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Has rechazado la invitación. El enlace ya no es válido.
          </p>
        </div>
        <a
          href="/"
          className="inline-block text-sm text-blue-600 hover:text-blue-500"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
