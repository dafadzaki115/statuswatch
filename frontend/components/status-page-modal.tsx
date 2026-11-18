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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-background border border-border rounded-lg max-w-lg w-full p-5 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-muted text-foreground flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {isEditing ? 'Ubah Halaman Status' : 'Buat Halaman Status Baru'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Bagikan status uptime dan pemantauan sistem kepada publik tanpa login.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="p-3 bg-[hsl(var(--status-down-bg))] border border-[hsl(var(--status-down))] rounded-lg text-xs text-[hsl(var(--status-down))] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {isLimitReached && (
          <div className="p-3 bg-[hsl(var(--status-warn-bg))] border border-[hsl(var(--status-warn))] rounded-lg text-xs text-[hsl(var(--status-warn))]">
            Batas kuota status page tercapai ({totalStatusPages}/{maxLimit}). Upgrade ke Pro di menu Settings untuk mengelola hingga 5 status page.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">
              Judul Halaman <span className="text-[hsl(var(--status-down))]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Status Layanan Perusahaan"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-xs"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">
              Alamat URL (Slug) <span className="text-[hsl(var(--status-down))]">*</span>
            </label>
            <div className="flex items-center">
              <span className="inline-flex items-center h-9 px-2.5 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-xs font-mono select-none">
                /status/
              </span>
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="layanan-utama"
                  className="w-full h-9 px-3 rounded-r-lg border border-border bg-background text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-xs"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                  {slugStatus === 'checking' && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                  {slugStatus === 'valid' && <Check className="w-3.5 h-3.5 text-[hsl(var(--status-up))]" />}
                  {slugStatus === 'invalid' && <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--status-down))]" />}
                </div>
              </div>
            </div>
            {slugMessage && (
              <p
                className={`text-[11px] ${
                  slugStatus === 'valid'
                    ? 'text-[hsl(var(--status-up))]'
                    : slugStatus === 'invalid'
                    ? 'text-[hsl(var(--status-down))]'
                    : 'text-muted-foreground'
                }`}
              >
                {slugMessage}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">
              Deskripsi (Opsional)
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Informasi singkat mengenai layanan atau situs yang dipantau."
              className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-xs resize-none"
            />
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-ring cursor-pointer"
            />
            <label htmlFor="is_public" className="text-xs text-foreground cursor-pointer select-none">
              Publikasikan halaman status ini (dapat dibuka oleh siapa saja tanpa login)
            </label>
          </div>

          {/* Monitor Association */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="font-medium text-foreground block">
              Pilih Monitor yang Ditampilkan ({selectedMonitorIds.length} dipilih)
            </label>

            {allMonitors.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">
                Belum ada monitor yang dibuat. Buat monitor terlebih dahulu di menu Monitor.
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto divide-y divide-border border border-border rounded-lg p-1">
                {allMonitors.map((mon) => {
                  const isChecked = selectedMonitorIds.includes(mon.id);
                  return (
                    <label
                      key={mon.id}
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMonitor(mon.id)}
                        className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-ring cursor-pointer"
                      />
                      <span className="text-foreground text-xs font-mono truncate flex-1">
                        {mon.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {mon.current_status.toUpperCase()}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-8 px-3 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || isLimitReached || slugStatus === 'invalid' || slugStatus === 'checking'}
              className="h-8 px-3.5 rounded-lg text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 shadow-xs transition-opacity disabled:opacity-60 flex items-center gap-1.5"
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
