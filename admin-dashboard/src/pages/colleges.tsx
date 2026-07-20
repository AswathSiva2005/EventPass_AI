import { Building2, CheckCircle2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getColleges, saveColleges } from "../api/admin";
import type { RefItem } from "../types/api";

const standardDepartments=[
  {name:"B.E Computer Science and Engineering",code:"CSE"},
  {name:"B.Tech Information Technology",code:"ITECH"},
  {name:"B.E Electronics and Communication Engineering",code:"ECE"},
  {name:"B.E Electrical and Electronics Engineering",code:"EEE"},
  {name:"B.E Mechanical Engineering",code:"MECH"},
  {name:"B.E Civil Engineering",code:"CIVIL"},
  {name:"B.Tech Artificial Intelligence and Data Science",code:"AIDS"},
  {name:"B.Tech Artificial Intelligence and Machine Learning",code:"AIML"}
];

const starter=`Government College of Technology | GCT | Coimbatore
PSG College of Technology | PSGTECH | Coimbatore
Coimbatore Institute of Technology | CIT | Coimbatore
KPR Institute of Engineering and Technology | KPRIET | Coimbatore
Sri Krishna College of Engineering and Technology | SKCET | Coimbatore
Government College of Engineering, Erode | GCEE | Erode
Kongu Engineering College | KEC | Erode
Bannari Amman Institute of Technology | BIT | Erode
Velalar College of Engineering and Technology | VCET | Erode
Nandha Engineering College | NEC | Erode
Builders Engineering College | BEC | Tiruppur
Jai Shriram Engineering College | JSEC | Tiruppur
Sasurie College of Engineering | SCE | Tiruppur
Angel College of Engineering and Technology | ACET | Tiruppur
Government College of Engineering, Salem | GCES | Salem
Sona College of Technology | SONA | Salem
Knowledge Institute of Technology | KIOT | Salem
AVS Engineering College | AVSEC | Salem
V S A Group of Institutions | VSA | Salem
College of Engineering, Guindy | CEG | Chennai
Alagappa College of Technology | ACT | Chennai
Madras Institute of Technology | MIT | Chennai
Chennai Institute of Technology | CHENNAIIT | Chennai
Easwari Engineering College | EEC | Chennai`;

export const CollegesPage=()=>{
  const [text,setText]=useState(starter),[items,setItems]=useState<RefItem[]>([]),[saving,setSaving]=useState(false);
  const load=()=>getColleges().then(setItems).catch(()=>toast.error("Unable to load colleges"));
  useEffect(()=>{void load();},[]);
  const save=async()=>{
    const rows=text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    const colleges=rows.map((line,index)=>{
      const [name,code,city]=line.split("|").map(value=>value.trim());
      if(!name||!code||!city)throw new Error(`Line ${index+1} must be: College Name | CODE | City`);
      return {name,code:code.toUpperCase(),city,departments:standardDepartments};
    });
    setSaving(true);
    try{const saved=await saveColleges(colleges);toast.success(`${saved.length} colleges and their departments saved`);await load();}
    catch(error){toast.error(error instanceof Error?error.message:"Colleges could not be saved");}
    finally{setSaving(false);}
  };
  return <div><div><p className="text-xs font-extrabold tracking-[.2em] text-lime-700 uppercase dark:text-lime-300">Reference directory</p><h1 className="mt-2 font-display text-3xl font-bold tracking-[-.045em]">Colleges and departments</h1><p className="mt-2 text-sm text-slate-500">Type one college per line. Existing codes are updated, so duplicates are avoided.</p></div>
    <div className="mt-7 grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><section className="panel rounded-3xl p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-lime-300 text-ink-950"><Upload size={19}/></span><div><h2 className="font-display text-xl font-bold">Bulk add colleges</h2><p className="text-xs text-slate-500">Format: College Name | CODE | City</p></div></div><textarea value={text} onChange={event=>setText(event.target.value)} rows={18} spellCheck={false} className="focus-ring mt-5 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-7 text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"/><div className="mt-3 flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-xs leading-5 text-sky-800 dark:bg-sky-400/10 dark:text-sky-200"><CheckCircle2 size={16} className="mt-0.5 shrink-0"/>Eight common engineering departments are added automatically to every college. You can add or refine college-specific departments later.</div><button disabled={saving||!text.trim()} onClick={()=>void save()} className="mt-5 h-11 w-full rounded-xl bg-ink-950 text-sm font-bold text-white hover:bg-lime-400 hover:text-ink-950 disabled:opacity-50 dark:bg-lime-300 dark:text-ink-950">{saving?"Saving colleges…":"Save all colleges"}</button></section>
      <section><div className="flex items-end justify-between"><div><h2 className="font-display text-xl font-bold">Current directory</h2><p className="mt-1 text-xs text-slate-500">{items.length} active colleges</p></div></div><div className="mt-4 max-h-[690px] space-y-2 overflow-y-auto pr-1">{items.map(item=><article key={item._id} className="panel flex items-center gap-3 rounded-2xl p-3.5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/5"><Building2 size={18}/></span><div className="min-w-0"><p className="truncate text-sm font-bold">{item.name}</p><p className="mt-0.5 font-mono text-xs text-slate-500">{item.code}</p></div></article>)}</div></section></div>
  </div>;
};
