import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsClient } from '@/components/settings-client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ambil profil pengguna
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Hitung jumlah monitor milik pengguna
  const { count: monitorCount } = await supabase
    .from('monitors')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id);

  // Hitung jumlah status page milik pengguna
  const { count: statusPageCount } = await supabase
    .from('status_pages')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id);

  const plan = (profile?.plan || 'free') as 'free' | 'pro';
  const email = profile?.email || user.email || '';

  return (
    <SettingsClient
      userEmail={email}
      currentPlan={plan}
      monitorCount={monitorCount || 0}
      statusPageCount={statusPageCount || 0}
    />
  );
}
