import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Edit } from 'lucide-react';
import { EditMonitorForm } from './edit-form';
import type { PlanType, Monitor } from '@statuswatch/backend';

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

  // Ambil daftar status pages jika ada
  const { data: statusPages } = await supabase
    .from('status_pages')
    .select('id, title')
    .eq('owner_id', user.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/monitors/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Detail Monitor</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Edit className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ubah Monitor
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Perbarui konfigurasi untuk {monitor.name}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <EditMonitorForm monitor={monitor as Monitor} plan={plan} statusPages={statusPages || []} />
      </div>
    </div>
  );
}
