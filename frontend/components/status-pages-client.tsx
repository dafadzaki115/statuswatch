'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Globe, ExternalLink, Edit, ArrowUpRight, CheckCircle2, EyeOff } from 'lucide-react';
import type { StatusPage, Monitor } from '@statuswatch/backend';
import { CopyLinkButton } from './copy-link-button';
import { StatusPageModal } from './status-page-modal';
import { DeleteStatusPageDialog } from './delete-status-page-dialog';

interface StatusPagesClientProps {
  statusPages: StatusPage[];
  allMonitors: Monitor[];
  currentPlan: string;
}

export function StatusPagesClient({
  statusPages,
  allMonitors,
  currentPlan,
}: StatusPagesClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StatusPage | null>(null);

  const maxLimit = currentPlan === 'pro' ? 5 : 1;
  const canAddMore = statusPages.length < maxLimit;

  const handleOpenCreate = () => {
    setEditingPage(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (page: StatusPage) => {
    setEditingPage(page);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kelola Status Page
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Buat dan bagikan halaman status publik dengan transparansi uptime ({statusPages.length}/{maxLimit} digunakan).
          </p>
        </div>

        {canAddMore ? (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Status Page</span>
          </button>
        ) : (
          <Link
            href="/settings"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition-colors"
          >
            <span>Batas Kuota ({maxLimit}) Tercapai — Upgrade ke Pro</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Status Pages List */}
      {statusPages.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Globe className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Belum Ada Halaman Status
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Halaman status publik memungkinkan pelanggan atau pengguna melihat ketersediaan situs web Anda tanpa perlu login.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Halaman Status Pertama</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {statusPages.map((page) => {
            const linkedMonitors = allMonitors.filter((m) => m.status_page_id === page.id);

            return (
              <div
                key={page.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-emerald-500/50 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {page.title}
                      </h3>
                      {page.is_public ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Publik</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Privat</span>
                        </span>
                      )}
                    </div>
                    {page.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                        {page.description}
                      </p>
                    )}
                    <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      /status/{page.slug}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <CopyLinkButton slug={page.slug} />
                    <a
                      href={`/status/${page.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                    >
                      <span>Buka</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(page)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Ubah</span>
                    </button>
                    <DeleteStatusPageDialog pageId={page.id} pageTitle={page.title} />
                  </div>
                </div>

                {/* Linked Monitors Summary */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Monitor tertaut: <strong className="text-slate-800 dark:text-slate-200">{linkedMonitors.length}</strong> monitor
                  </span>
                  <div className="flex items-center gap-2">
                    {linkedMonitors.slice(0, 3).map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]"
                      >
                        {m.name}
                      </span>
                    ))}
                    {linkedMonitors.length > 3 && (
                      <span className="text-[11px] text-slate-400">
                        +{linkedMonitors.length - 3} lainnya
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog for Create/Edit */}
      <StatusPageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        page={editingPage}
        allMonitors={allMonitors}
        currentPlan={currentPlan}
        totalStatusPages={statusPages.length}
      />
    </div>
  );
}
