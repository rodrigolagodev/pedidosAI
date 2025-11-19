'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrganization } from '@/lib/organizations/actions';

export function OnboardingForm() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setIsLoading(true);

    const result = await createOrganization(name.trim());

    if (!result.success) {
      setError(result.error || 'Error al crear la organización');
      setIsLoading(false);
      return;
    }

    // Redirect to the new organization's dashboard
    router.push(`/${result.data?.slug || 'dashboard'}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="orgName"
          className="block text-sm font-medium text-gray-700"
        >
          Nombre del restaurante o negocio
        </label>
        <input
          id="orgName"
          name="orgName"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Mi Restaurante"
          autoFocus
        />
        <p className="mt-1 text-xs text-gray-500">
          Este nombre aparecerá en tus pedidos enviados a proveedores
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Creando...' : 'Crear Organización'}
      </button>
    </form>
  );
}
