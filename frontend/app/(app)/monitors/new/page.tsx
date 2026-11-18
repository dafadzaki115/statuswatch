import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft } from 'lucide-react';
import { MonitorForm } from './monitor-form';
import type { PlanType } from '@statuswatch/backend';

export const dynamic = 'force-dynamic';

export default async function NewMonitorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const plan = (profile?.plan || 'free') as PlanType;

  const { data: statusPages } = await supabase
    .from('status_pages')
    .select('id, title')
    .eq('owner_id', user.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/monitors"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Monitor</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Tambah Monitor Baru
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Konfigurasikan target situs atau API yang ingin dipantau.
        </p>
      </div>

      <div className="bg-background border border-border rounded-lg p-5 sm:p-6">
        <MonitorForm plan={plan} statusPages={statusPages || []} />
      </div>
    </div>
  );
}
