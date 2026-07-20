import { ArrowRight, LockKeyhole, ScanLine } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/auth";

export const LoginPage=()=>{
  const {user,login}=useAuth(); const navigate=useNavigate();
  const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm<{email:string;password:string;remember:boolean}>();
  if(user)return <Navigate to="/" replace/>;
  const submit=async(values:{email:string;password:string;remember:boolean})=>{try{await login(values.email,values.password,values.remember);void navigate("/",{replace:true});}catch{toast.error("Unable to sign in. Check your credentials and email verification.");}};
  return <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden bg-ink-950 p-14 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgb(150_233_79_/_20%),transparent_32%)]"/><div className="relative flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-lime-300 text-ink-950"><ScanLine/></span><span className="font-display text-xl font-bold">EventPass AI</span></div><div className="relative max-w-xl"><p className="text-xs font-extrabold tracking-[.24em] text-lime-300 uppercase">Event operations</p><h1 className="mt-5 font-display text-6xl leading-[.98] font-bold tracking-[-.06em]">See the crowd before it becomes one.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Live registration, verification, venue, and attendance intelligence in one secure workspace.</p></div><p className="relative text-xs text-slate-500">Restricted to authorized event administrators.</p></section>
    <section className="grid place-items-center p-6"><form onSubmit={(e)=>void handleSubmit(submit)(e)} className="w-full max-w-md"><span className="grid size-12 place-items-center rounded-2xl bg-lime-300 text-ink-950"><LockKeyhole/></span><h2 className="mt-7 font-display text-4xl font-bold tracking-[-.05em]">Admin sign in</h2><p className="mt-3 text-sm leading-6 text-slate-500">Use your verified EventPass administrator account.</p>
      <label className="mt-8 block text-sm font-bold">Email<input type="email" autoComplete="email" className="focus-ring mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-white/5" {...register("email",{required:"Email is required"})}/></label>{errors.email&&<p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
      <label className="mt-5 block text-sm font-bold">Password<input type="password" autoComplete="current-password" className="focus-ring mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-white/5" {...register("password",{required:"Password is required"})}/></label>{errors.password&&<p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
      <label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" className="size-4 accent-lime-400" {...register("remember")}/>Remember this device</label>
      <button disabled={isSubmitting} className="focus-ring mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-950 text-sm font-bold text-white hover:bg-lime-400 hover:text-ink-950 disabled:opacity-60 dark:bg-lime-300 dark:text-ink-950">{isSubmitting?"Signing in…":"Continue"}<ArrowRight size={17}/></button>
    </form></section>
  </main>;
};
