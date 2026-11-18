import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-8 shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
          <HelpCircle className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
          404 — Halaman Tidak Ditemukan
        </h1>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Halaman yang Anda tuju tidak tersedia, telah dipindahkan, atau bersifat privat.
        </p>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-sm transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
