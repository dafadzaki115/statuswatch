export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center animate-pulse">
          <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Memuat StatusWatch...
        </p>
      </div>
    </div>
  );
}
