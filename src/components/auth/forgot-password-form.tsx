'use client';

import { useState } from 'react';
import { resetPassword } from '@/lib/auth/actions';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await resetPassword(email);

    if (!result.success) {
      setError(result.error || 'Error al enviar el email');
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4">
        <h3 className="text-sm font-medium text-green-800">
          Email enviado
        </h3>
        <p className="mt-2 text-sm text-green-700">
          Si existe una cuenta con el email <strong>{email}</strong>, recibirás
          un enlace para restablecer tu contraseña.
        </p>
        <p className="mt-2 text-sm text-green-700">
          Revisa tu bandeja de entrada y la carpeta de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Ingresa tu email y te enviaremos un enlace para restablecer tu
        contraseña.
      </p>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="tu@email.com"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
      </button>
    </form>
  );
}
