import { ArrowLeft, RouteOff } from "lucide-react";
import { Link } from "react-router-dom";

export const NotFoundPage = () => (
  <section className="page-shell grid min-h-[65vh] place-items-center py-20 text-center">
    <div><RouteOff className="mx-auto text-emerald-700 dark:text-mint-300" size={48} /><p className="mt-5 font-display text-7xl font-bold text-slate-200 dark:text-white/10">404</p><h1 className="mt-2 font-display text-2xl font-bold">This pass leads nowhere</h1><p className="mt-3 text-sm text-slate-600 dark:text-slate-300">The page may have moved or the address is incorrect.</p><Link to="/" className="focus-ring mt-6 inline-flex items-center gap-2 rounded-xl bg-ink-950 px-5 py-3 text-sm font-bold text-white dark:bg-mint-300 dark:text-ink-950"><ArrowLeft size={16} /> Back home</Link></div>
  </section>
);
