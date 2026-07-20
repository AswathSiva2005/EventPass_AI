import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Link, useRouteError } from "react-router-dom";

export const RouteErrorPage = () => {
  const error = useRouteError();

  if (import.meta.env.DEV) {
    console.error("A page could not be rendered", error);
  }

  return (
    <section className="page-shell grid min-h-[65vh] place-items-center py-20 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
          <AlertTriangle size={28} />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold">This page needs a quick refresh</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          We could not display part of this page. Your information is safe—please try again.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-ink-950 px-5 py-3 text-sm font-bold text-white dark:bg-mint-300 dark:text-ink-950"
          >
            <RotateCcw size={16} /> Try again
          </button>
          <Link
            to="/"
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold dark:border-white/10 dark:bg-white/5"
          >
            <Home size={16} /> Go home
          </Link>
        </div>
      </div>
    </section>
  );
};
