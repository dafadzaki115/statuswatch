import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft } from 'lucide-react';
import { EditMonitorForm } from './edit-form';
import type { PlanType, Monitor } from '@statuswatch/backend';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditMonitorPage({ params }: Props) {
  const { id } = await params;
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

  // Ambil monitor milik user
  const { data: monitor } = await supabase
    .from('monitors')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (!monitor) {
    notFound();
  }

  const { data: statusPages } = await supabase
    .from('status_pages')
    .select('id, title')
    .eq('owner_id', user.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/monitors/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Detail Monitor</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Ubah Monitor
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Perbarui konfigurasi target pemantauan {monitor.name}.
        </p>
      </div>

      <div className="bg-background border border-border rounded-lg p-5 sm:p-6">
        <EditMonitorForm monitor={monitor as Monitor} plan={plan} statusPages={statusPages || []} />
      </div>
    </div>
  );
}
