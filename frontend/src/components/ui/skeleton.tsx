export const EventCardSkeleton = () => (
  <div className="surface animate-pulse rounded-3xl p-5" aria-hidden="true">
    <div className="flex gap-4">
      <div className="size-16 rounded-2xl bg-slate-200 dark:bg-white/8" />
      <div className="flex-1 space-y-3">
        <div className="h-3 w-24 rounded bg-slate-200 dark:bg-white/8" />
        <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-white/8" />
        <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-white/8" />
      </div>
    </div>
    <div className="mt-6 h-4 rounded bg-slate-200 dark:bg-white/8" />
    <div className="mt-3 h-4 w-4/5 rounded bg-slate-200 dark:bg-white/8" />
    <div className="mt-8 h-11 rounded-xl bg-slate-200 dark:bg-white/8" />
  </div>
);
