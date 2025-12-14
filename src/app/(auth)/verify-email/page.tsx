import Link from 'next/link';

export const metadata = {
  title: 'Verificar Email - Supplai',
  description: 'Confirma tu dirección de email',
};

export default function VerifyEmailPage() {
  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-md bg-blue-50 p-4">
        <h3 className="text-sm font-medium text-blue-800">Revisa tu correo electrónico</h3>
        <div className="mt-2 text-sm text-blue-700">
          <p>
            Te hemos enviado un enlace de confirmación a tu email. Por favor revisa tu bandeja de
            entrada y haz clic en el enlace para verificar tu cuenta.
          </p>
          <p className="mt-2">Si no encuentras el correo, revisa tu carpeta de spam.</p>
        </div>
      </div>

      <div className="text-center">
        <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
