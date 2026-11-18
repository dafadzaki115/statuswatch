import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '../(auth)/actions';
import { AppNav } from '@/components/app-nav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Validasi sesi dengan getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email')
    .eq('id', user.id)
    .single();

  const planName = (profile?.plan || 'free').toUpperCase();
  const userEmail = profile?.email || user.email || 'Pengguna';

  return (
    <AppNav userEmail={userEmail} planName={planName} logoutAction={logoutAction}>
      {children}
    </AppNav>
  );
}
