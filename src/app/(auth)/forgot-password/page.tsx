import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import Link from 'next/link';

export const metadata = {
  title: 'Recuperar Contraseña - Supplai',
  description: 'Recupera el acceso a tu cuenta',
};

export default function ForgotPasswordPage() {
  return (
    <div className="mt-8 space-y-6">
      <ForgotPasswordForm />

      <div className="text-center text-sm">
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
