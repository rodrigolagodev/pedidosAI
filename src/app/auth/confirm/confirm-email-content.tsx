'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      // If there's no token, this might be a first-time visit
      if (!token) {
        setStatus('success');
        return;
      }

      // Verify the token with Supabase
      const supabase = createClient();

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type === 'email' ? 'email' : 'signup',
        });

        if (error) {
          setStatus('error');
          setErrorMessage(error.message);
          return;
        }

        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMessage('Ha ocurrido un error inesperado');
        console.error('Confirmation error:', err);
      }
    };

    confirmEmail();
  }, [searchParams]);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (status !== 'success') return;

    if (countdown === 0) {
      router.push('/login');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, router]);

  if (status === 'loading') {
    return (
      <div className="rounded-md bg-blue-50 p-4 text-center text-sm text-blue-700">
        <svg
          className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Verificando tu email...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al confirmar tu email</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{errorMessage || 'El enlace de confirmación ha expirado o es inválido.'}</p>
              <p className="mt-2">
                Por favor, intenta{' '}
                <Link href="/register" className="font-medium underline hover:text-red-600">
                  registrarte nuevamente
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-green-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-green-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-green-800">¡Email confirmado!</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>Tu cuenta ha sido verificada exitosamente.</p>
            <p className="mt-2">
              Serás redirigido al inicio de sesión en{' '}
              <span className="font-bold text-green-800">{countdown}</span> segundo
              {countdown !== 1 ? 's' : ''}...
            </p>
          </div>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Ir al inicio de sesión ahora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
