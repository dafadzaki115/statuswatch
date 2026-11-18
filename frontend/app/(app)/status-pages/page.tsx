import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusPagesClient } from '@/components/status-pages-client';
import type { StatusPage, Monitor } from '@statuswatch/backend';

export default async function StatusPagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Ambil profil user
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const currentPlan = profile?.plan || 'free';

  // 2. Ambil seluruh status page milik user
  const { data: statusPagesData } = await supabase
    .from('status_pages')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  // 3. Ambil seluruh monitor milik user (untuk relasi status_page_id)
  const { data: monitorsData } = await supabase
    .from('monitors')
    .select('*')
    .eq('owner_id', user.id)
    .order('name', { ascending: true });

  const statusPages = (statusPagesData as StatusPage[]) || [];
  const allMonitors = (monitorsData as Monitor[]) || [];

  return (
    <StatusPagesClient
      statusPages={statusPages}
      allMonitors={allMonitors}
      currentPlan={currentPlan}
    />
  );
}
