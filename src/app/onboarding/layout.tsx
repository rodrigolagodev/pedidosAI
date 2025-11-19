import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect('/login' as any);
  }

  return <>{children}</>;
}
