import { CalendarX2, RefreshCw } from "lucide-react";
import { Button } from "./button";

export const EmptyState = ({
  title,
  message,
  onRetry
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) => (
  <div className="surface col-span-full rounded-3xl px-6 py-14 text-center">
    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-mint-300/10 dark:text-mint-300">
      <CalendarX2 />
    </span>
    <h2 className="mt-5 font-display text-xl font-bold text-ink-950 dark:text-white">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry} className="mt-5">
        <RefreshCw size={16} /> Try again
      </Button>
    )}
  </div>
);
