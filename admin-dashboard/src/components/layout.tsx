import { Building2, CalendarPlus, LayoutDashboard, LogOut, Menu, Moon, ScanLine, Sun, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth";

const navigation = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/registrations", label: "Registrations", icon: Users },
  { to: "/events", label: "Events & venues", icon: CalendarPlus },
  { to: "/colleges", label: "Colleges", icon: Building2 }
];

export const Layout = () => {
  const [open,setOpen]=useState(false);
  const [dark,setDark]=useState(()=>localStorage.getItem("eventpass-admin-theme")==="dark" || (!localStorage.getItem("eventpass-admin-theme") && matchMedia("(prefers-color-scheme: dark)").matches));
  const {user,logout}=useAuth();
  useEffect(()=>{document.documentElement.classList.toggle("dark",dark);localStorage.setItem("eventpass-admin-theme",dark?"dark":"light");},[dark]);
  const sidebar = (
    <>
      <div className="flex h-20 items-center gap-3 px-5"><span className="grid size-10 place-items-center rounded-xl bg-lime-300 text-ink-950"><ScanLine size={21}/></span><div><p className="font-display text-lg font-bold tracking-[-.04em]">EventPass AI</p><p className="text-[10px] font-extrabold tracking-[.16em] text-slate-500 uppercase">Admin console</p></div></div>
      <nav className="mt-4 grid gap-1 px-3">
        {navigation.map(({to,label,icon:Icon})=><NavLink key={to} to={to} end={to==="/"} onClick={()=>setOpen(false)} className={({isActive})=>`focus-ring flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${isActive?"bg-lime-300 text-ink-950":"text-slate-500 hover:bg-slate-100 hover:text-ink-950 dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-white"}`}><Icon size={18}/>{label}</NavLink>)}
      </nav>
      <div className="mt-auto border-t border-slate-200 p-4 dark:border-white/8">
        <div className="mb-3 min-w-0 px-2"><p className="truncate text-sm font-bold">{user?.name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div>
        <button onClick={()=>void logout()} className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-400/8"><LogOut size={17}/>Sign out</button>
      </div>
    </>
  );
  return <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[248px] flex-col border-r border-slate-200 bg-white lg:flex dark:border-white/8 dark:bg-ink-900">{sidebar}</aside>
    {open&&<><button aria-label="Close navigation" className="fixed inset-0 z-40 bg-ink-950/55 lg:hidden" onClick={()=>setOpen(false)}/><aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white dark:bg-ink-900">{sidebar}</aside></>}
    <div className="min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-slate-200 bg-[#f4f6f3]/88 px-4 backdrop-blur-xl sm:px-7 dark:border-white/8 dark:bg-ink-950/88">
        <div className="flex items-center gap-3"><button onClick={()=>setOpen(true)} className="grid size-10 place-items-center rounded-xl lg:hidden"><Menu/></button><div><p className="text-xs font-bold text-slate-500">Operations workspace</p><p className="font-display font-bold">Welcome back, {user?.name.split(" ")[0]}</p></div></div>
        <button onClick={()=>setDark(value=>!value)} className="focus-ring grid size-10 place-items-center rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5" aria-label="Toggle dark mode">{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
      </header>
      <main className="p-4 sm:p-7 lg:p-9"><Outlet/></main>
    </div>
    {open&&<button onClick={()=>setOpen(false)} className="fixed top-5 left-[225px] z-[60] text-ink-950 lg:hidden"><X/></button>}
  </div>;
};
