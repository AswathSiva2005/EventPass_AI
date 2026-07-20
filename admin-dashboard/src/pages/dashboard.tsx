import { Building2, CalendarCheck, CircleX, Clock3, DoorOpen, LogOut, Users, Warehouse } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDashboard } from "../api/admin";
import type { DashboardData } from "../types/api";

const cards=[
  ["Today's visitors","todaysVisitors",CalendarCheck,"text-sky-600 bg-sky-100 dark:bg-sky-400/10"],
  ["Total registrations","totalRegistrations",Users,"text-violet-600 bg-violet-100 dark:bg-violet-400/10"],
  ["Inside campus","insideCampus",DoorOpen,"text-emerald-600 bg-emerald-100 dark:bg-emerald-400/10"],
  ["Exited","exited",LogOut,"text-slate-600 bg-slate-200 dark:bg-white/8"],
  ["Pending","pending",Clock3,"text-amber-600 bg-amber-100 dark:bg-amber-400/10"],
  ["Rejected","rejected",CircleX,"text-rose-600 bg-rose-100 dark:bg-rose-400/10"],
  ["Colleges","colleges",Building2,"text-cyan-600 bg-cyan-100 dark:bg-cyan-400/10"],
  ["Departments","departments",Warehouse,"text-lime-700 bg-lime-100 dark:bg-lime-400/10"]
] as const;

export const DashboardPage=()=>{
  const [data,setData]=useState<DashboardData>(); const [error,setError]=useState(false);
  useEffect(()=>{getDashboard().then(setData).catch(()=>setError(true));},[]);
  if(error)return <div className="panel rounded-3xl p-10 text-center"><h1 className="font-display text-2xl font-bold">Dashboard unavailable</h1><p className="mt-2 text-sm text-slate-500">Check the API connection and your administrator session.</p></div>;
  return <div><div><p className="text-xs font-extrabold tracking-[.2em] text-lime-700 uppercase dark:text-lime-300">Live operations</p><h1 className="mt-2 font-display text-3xl font-bold tracking-[-.045em]">Event command center</h1><p className="mt-2 text-sm text-slate-500">Visitor and registration activity across every connected event.</p></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,key,Icon,color],i)=><motion.article key={key} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.04}} className="panel rounded-2xl p-5"><div className="flex items-center justify-between"><span className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon size={19}/></span><span className="text-[10px] font-bold text-slate-400 uppercase">Live</span></div><p className="mt-5 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 font-display text-3xl font-bold">{data?.totals[key]??"—"}</p></motion.article>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <section className="panel rounded-3xl p-5 sm:p-7"><div><h2 className="font-display text-xl font-bold">Registration momentum</h2><p className="mt-1 text-xs text-slate-500">Last seven days</p></div><div className="mt-6 h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data?.registrationTrend??[]}><defs><linearGradient id="trend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#96e94f" stopOpacity={.4}/><stop offset="95%" stopColor="#96e94f" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={.2}/><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis allowDecimals={false} tickLine={false} axisLine={false}/><Tooltip/><Area type="monotone" dataKey="registrations" stroke="#76c83d" strokeWidth={3} fill="url(#trend)"/></AreaChart></ResponsiveContainer></div></section>
      <section className="panel rounded-3xl p-5 sm:p-7"><h2 className="font-display text-xl font-bold">Top colleges</h2><p className="mt-1 text-xs text-slate-500">Registration distribution</p><div className="mt-6 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data?.collegeDistribution??[]} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={.2}/><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={95} tickLine={false} axisLine={false} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="registrations" fill="#96e94f" radius={[0,8,8,0]}/></BarChart></ResponsiveContainer></div></section>
    </div>
  </div>;
};
