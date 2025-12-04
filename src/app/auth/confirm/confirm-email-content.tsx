'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function ConfirmEmailContent() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (countdown === 0) {
      router.push('/login');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

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
