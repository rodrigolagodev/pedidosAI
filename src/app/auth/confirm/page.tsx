import { Suspense } from 'react';
import { ConfirmEmailContent } from './confirm-email-content';

export const metadata = {
  title: 'Confirmar Email - Pedidos',
  description: 'Confirma tu dirección de email',
};

export default function ConfirmEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Confirma tu email
          </h1>
        </div>

        <Suspense
          fallback={
            <div className="rounded-md bg-blue-50 p-4 text-center text-sm text-blue-700">
              Verificando tu email...
            </div>
          }
        >
          <ConfirmEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
