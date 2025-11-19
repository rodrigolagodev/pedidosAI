'use client';

import { useState } from 'react';
import { acceptInvitation } from '@/lib/organizations/actions';

interface AcceptInvitationFormProps {
  token: string;
}

export function AcceptInvitationForm({ token }: AcceptInvitationFormProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleAccept() {
    setError('');
    setIsLoading(true);

    const result = await acceptInvitation(token);

    if (!result.success) {
      setError(result.error || 'Error al aceptar la invitación');
      setIsLoading(false);
      return;
    }

    // Redirect to the organization dashboard
    window.location.href = `/${result.data?.slug || 'dashboard'}`;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={isLoading}
        className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Aceptando...' : 'Aceptar invitación'}
      </button>

      <button
        onClick={() => (window.location.href = '/dashboard')}
        disabled={isLoading}
        className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancelar
      </button>
    </div>
  );
}
