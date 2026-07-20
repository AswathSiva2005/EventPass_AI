import { AlertTriangle, RotateCcw } from "lucide-react";
import { Link, useRouteError } from "react-router-dom";

export const RouteErrorPage=()=>{
  const error=useRouteError();
  if(import.meta.env.DEV)console.error("Admin page render failed",error);
  return <div className="grid min-h-[65vh] place-items-center text-center"><div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><AlertTriangle size={28}/></span><h1 className="mt-5 font-display text-3xl font-bold">This page could not be displayed</h1><p className="mt-3 text-sm leading-6 text-slate-500">The admin console encountered incomplete data. Refresh the page or return to the overview.</p><div className="mt-7 flex justify-center gap-3"><button onClick={()=>window.location.reload()} className="focus-ring flex items-center gap-2 rounded-xl bg-ink-950 px-5 py-3 text-sm font-bold text-white dark:bg-lime-300 dark:text-ink-950"><RotateCcw size={16}/>Try again</button><Link to="/" className="focus-ring rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold dark:border-white/10 dark:bg-white/5">Overview</Link></div></div></div>;
};
