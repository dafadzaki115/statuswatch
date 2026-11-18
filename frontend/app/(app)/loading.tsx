export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* 4 Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
          >
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
            <div className="h-8 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="h-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6" />
    </div>
  );
}
