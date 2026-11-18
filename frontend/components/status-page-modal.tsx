'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Globe, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { StatusPage, Monitor } from '@statuswatch/backend';

interface StatusPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  page?: StatusPage | null; // null if create new, StatusPage if edit
  allMonitors: Monitor[];
  currentPlan: string;
  totalStatusPages: number;
}

export function StatusPageModal({
  isOpen,
  onClose,
  page,
  allMonitors,
  currentPlan,
  totalStatusPages,
}: StatusPageModalProps) {
  const router = useRouter();
  const isEditing = Boolean(page);

  const [title, setTitle] = useState(page?.title || '');
  const [slug, setSlug] = useState(page?.slug || '');
  const [description, setDescription] = useState(page?.description || '');
  const [isPublic, setIsPublic] = useState(page?.is_public ?? true);
  const [selectedMonitorIds, setSelectedMonitorIds] = useState<string[]>([]);

  // Slug validation state
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [slugMessage, setSlugMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize selected monitors on open
  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setDescription(page.description || '');
      setIsPublic(page.is_public);
      const linked = allMonitors.filter((m) => m.status_page_id === page.id).map((m) => m.id);
      setSelectedMonitorIds(linked);
      setSlugStatus('valid');
      setSlugMessage(null);
    } else {
      setTitle('');
      setSlug('');
      setDescription('');
      setIsPublic(true);
      setSelectedMonitorIds([]);
      setSlugStatus('idle');
      setSlugMessage(null);
    }
    setFormError(null);
  }, [page, isOpen, allMonitors]);

  // Debounced slug check
  useEffect(() => {
    if (!slug) {
      setSlugStatus('idle');
      setSlugMessage(null);
      return;
    }

    // Client-side regex format check
    const slugRegex = /^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$/;
    if (!slugRegex.test(slug)) {
      setSlugStatus('invalid');
      setSlugMessage('Slug hanya boleh huruf kecil, angka, strip (-), panjang 3-40 karakter.');
      return;
    }

    // If editing and slug hasn't changed
    if (isEditing && page?.slug === slug) {
      setSlugStatus('valid');
      setSlugMessage('Slug saat ini (tidak berubah).');
      return;
    }

    setSlugStatus('checking');
    setSlugMessage('Memeriksa ketersediaan slug...');

    const timer = setTimeout(async () => {
      try {
        const queryParams = new URLSearchParams({ checkSlug: slug });
        if (page?.id) queryParams.set('excludeId', page.id);

        const res = await fetch(`/api/status-pages?${queryParams.toString()}`);
        const data = await res.json();

        if (data.available) {
          setSlugStatus('valid');
          setSlugMessage('Slug tersedia dan dapat digunakan!');
        } else {
          setSlugStatus('invalid');
          setSlugMessage(`Slug "${slug}" sudah digunakan oleh orang lain.`);
        }
      } catch {
        setSlugStatus('invalid');
        setSlugMessage('Gagal memverifikasi keunikan slug di server.');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug, isEditing, page?.id, page?.slug]);

  if (!isOpen) return null;

  const maxLimit = currentPlan === 'pro' ? 5 : 1;
  const isLimitReached = !isEditing && totalStatusPages >= maxLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) {
      setFormError(`Batas kuota status page untuk paket ${currentPlan.toUpperCase()} tercapai (Maks ${maxLimit}). Silakan upgrade ke Pro.`);
      return;
    }

    if (slugStatus === 'invalid') {
      setFormError('Perbaiki slug sebelum menyimpan.');
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      const endpoint = isEditing ? `/api/status-pages/${page?.id}` : '/api/status-pages';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          description: description || null,
          is_public: isPublic,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error?.message || 'Gagal menyimpan status page');
        setLoading(false);
        return;
      }

      const savedPageId = isEditing ? page?.id : data.data?.id;

      // Update monitor linking (attach/detach monitors to this status page)
      if (savedPageId) {
        for (const mon of allMonitors) {
          const isSelected = selectedMonitorIds.includes(mon.id);
          const currentLinked = mon.status_page_id === savedPageId;

          if (isSelected && !currentLinked) {
            await fetch(`/api/monitors/${mon.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status_page_id: savedPageId }),
            });
          } else if (!isSelected && currentLinked) {
            await fetch(`/api/monitors/${mon.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status_page_id: null }),
            });
          }
        }
      }

      router.refresh();
      onClose();
    } catch {
      setFormError('Terjadi kesalahan koneksi server');
    } finally {
      setLoading(false);
    }
  };

  const toggleMonitor = (monId: string) => {
    setSelectedMonitorIds((prev) =>
      prev.includes(monId) ? prev.filter((id) => id !== monId) : [...prev, monId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Ubah Halaman Status' : 'Buat Halaman Status Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Bagikan status uptime dan pemantauan sistem kepada publik tanpa login.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {isLimitReached && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            Batas kuota status page tercapai ({totalStatusPages}/{maxLimit}). Upgrade ke Pro di menu Settings untuk mengelola hingga 5 status page.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Judul Halaman <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Status Layanan Toko Online"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Slug with Debounced Validation */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Slug URL Publik <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">
                /status/
              </span>
              <input
                type="text"
                required
                maxLength={40}
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                placeholder="tokoku"
                className="w-full pl-16 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {slugStatus === 'checking' && (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                )}
                {slugStatus === 'valid' && (
                  <Check className="w-4 h-4 text-emerald-500" />
                )}
                {slugStatus === 'invalid' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            {slugMessage && (
              <p
                className={`text-[11px] ${
                  slugStatus === 'valid'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : slugStatus === 'invalid'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-400'
                }`}
              >
                {slugMessage}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Deskripsi (Opsional)
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Informasi singkat mengenai layanan atau situs yang dipantau."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="is_public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="is_public" className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Publikasikan halaman status ini (dapat dibuka oleh siapa saja tanpa login)
            </label>
          </div>

          {/* Monitor Association */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Pilih Monitor yang Ditampilkan di Halaman Ini ({selectedMonitorIds.length} dipilih)
            </label>

            {allMonitors.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                Belum ada monitor yang dibuat. Buat monitor terlebih dahulu di menu Monitor.
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
                {allMonitors.map((mon) => {
                  const isChecked = selectedMonitorIds.includes(mon.id);
                  return (
                    <label
                      key={mon.id}
                      className="flex items-center gap-2.5 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMonitor(mon.id)}
                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate flex-1">
                        {mon.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {mon.current_status.toUpperCase()}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || isLimitReached || slugStatus === 'invalid' || slugStatus === 'checking'}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-sm transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Status Page'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
