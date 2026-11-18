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
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Kelola Status Page
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Buat dan bagikan halaman status publik dengan transparansi uptime ({statusPages.length}/{maxLimit} digunakan).
          </p>
        </div>

        {canAddMore ? (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg font-medium text-xs sm:text-sm text-primary-foreground bg-primary hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Status Page</span>
          </button>
        ) : (
          <Link
            href="/settings"
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg font-medium text-xs text-[hsl(var(--status-warn))] bg-[hsl(var(--status-warn-bg))] border border-[hsl(var(--status-warn))] hover:opacity-90 transition-opacity"
          >
            <span>Batas Kuota ({maxLimit}) Tercapai — Upgrade ke Pro</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Status Pages List */}
      {statusPages.length === 0 ? (
        <div className="bg-background rounded-lg border border-border p-12 text-center">
          <div className="w-12 h-12 rounded-lg bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-3">
            <Globe className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Belum Ada Halaman Status
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto">
            Halaman status publik memungkinkan pengunjung melihat ketersediaan situs web tanpa perlu login.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Halaman Status Pertama</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {statusPages.map((page) => {
            const linkedMonitors = allMonitors.filter((m) => m.status_page_id === page.id);

            return (
              <div
                key={page.id}
                className="bg-background border border-border rounded-lg p-5 transition-colors space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground">
                        {page.title}
                      </h3>
                      {page.is_public ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[hsl(var(--status-up-bg))] text-[hsl(var(--status-up))]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Publik</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
                          <EyeOff className="w-3 h-3" />
                          <span>Privat</span>
                        </span>
                      )}
                    </div>
                    {page.description && (
                      <p className="text-xs text-muted-foreground max-w-xl">
                        {page.description}
                      </p>
                    )}
                    <p className="text-xs font-mono text-muted-foreground">
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
                      className="h-8 px-2.5 rounded-lg text-xs font-medium text-foreground border border-border bg-background hover:bg-muted transition-colors inline-flex items-center gap-1"
                    >
                      <span>Buka</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(page)}
                      className="h-8 px-2.5 rounded-lg text-xs font-medium text-foreground border border-border bg-background hover:bg-muted transition-colors inline-flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Ubah</span>
                    </button>
                    <DeleteStatusPageDialog pageId={page.id} pageTitle={page.title} />
                  </div>
                </div>

                {/* Linked Monitors Summary */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Monitor tertaut: <strong className="text-foreground">{linkedMonitors.length}</strong> monitor
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {linkedMonitors.slice(0, 3).map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 rounded border border-border bg-muted text-[11px] font-mono text-foreground truncate max-w-[140px]"
                      >
                        {m.name}
                      </span>
                    ))}
                    {linkedMonitors.length > 3 && (
                      <span className="text-[11px] text-muted-foreground">
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
