import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = {
  title: 'Nueva Contraseña - Supplai',
  description: 'Establece tu nueva contraseña',
};

export default function ResetPasswordPage() {
  return (
    <div className="mt-8 space-y-6">
      <ResetPasswordForm />
    </div>
  );
}
