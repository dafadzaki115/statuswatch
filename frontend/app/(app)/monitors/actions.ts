'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { MonitorService, type PlanType } from '@statuswatch/backend';

export interface MonitorActionResult {
  success?: boolean;
  error?: string;
  message?: string;
}

export async function createMonitorAction(
  _prevState: MonitorActionResult | null,
  formData: FormData
): Promise<MonitorActionResult> {
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

  const rawInput = {
    name: formData.get('name')?.toString() || '',
    url: formData.get('url')?.toString() || '',
    method: formData.get('method')?.toString() || 'GET',
    interval_minutes: formData.get('interval_minutes')
      ? Number(formData.get('interval_minutes'))
      : undefined,
    expected_status: formData.get('expected_status')
      ? Number(formData.get('expected_status'))
      : 200,
    timeout_ms: formData.get('timeout_ms')
      ? Number(formData.get('timeout_ms'))
      : 5000,
    is_active: formData.get('is_active') !== 'false',
  };

  try {
    const service = new MonitorService(supabase);
    await service.createMonitor(user.id, rawInput, plan);
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menambahkan monitor',
    };
  }

  revalidatePath('/dashboard');
  revalidatePath('/monitors');
  redirect('/monitors');
}

export async function updateMonitorAction(
  id: string,
  _prevState: MonitorActionResult | null,
  formData: FormData
): Promise<MonitorActionResult> {
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

  const rawInput = {
    name: formData.get('name')?.toString() || undefined,
    url: formData.get('url')?.toString() || undefined,
    method: formData.get('method')?.toString() || undefined,
    interval_minutes: formData.get('interval_minutes')
      ? Number(formData.get('interval_minutes'))
      : undefined,
    expected_status: formData.get('expected_status')
      ? Number(formData.get('expected_status'))
      : undefined,
    timeout_ms: formData.get('timeout_ms')
      ? Number(formData.get('timeout_ms'))
      : undefined,
    is_active: formData.get('is_active') === 'true',
  };

  try {
    const service = new MonitorService(supabase);
    await service.updateMonitor(id, user.id, rawInput, plan);
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal memperbarui monitor',
    };
  }

  revalidatePath('/dashboard');
  revalidatePath('/monitors');
  revalidatePath(`/monitors/${id}`);
  redirect(`/monitors/${id}`);
}

export async function deleteMonitorAction(id: string): Promise<MonitorActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  try {
    const service = new MonitorService(supabase);
    await service.deleteMonitor(id, user.id);
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menghapus monitor',
    };
  }

  revalidatePath('/dashboard');
  revalidatePath('/monitors');
  redirect('/monitors');
}
