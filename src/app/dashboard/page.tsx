import { redirect } from 'next/navigation';
import { getSessionOrRedirect, getDefaultOrganization } from '@/lib/auth/session';

export default async function DashboardRedirectPage() {
  await getSessionOrRedirect();

  const defaultOrg = await getDefaultOrganization();

  if (!defaultOrg) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect('/onboarding' as any);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  redirect(`/${defaultOrg.slug}` as any);
}
