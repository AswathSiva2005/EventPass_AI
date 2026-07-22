import axios from "axios";
import { ShieldCheck, UserCog, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createSubAdmin, getSubAdmins } from "../api/admin";
import { useAuth } from "../context/auth";
import type { SubAdmin } from "../types/api";

interface FormData {
  name: string;
  email: string;
  role: "admin" | "event_manager";
  password: string;
}

interface ApiErrorBody { error?: { message?: string; details?: Array<{ field?: string; message?: string }> } }

const field = "focus-ring mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100";

export const AdminAccountsPage = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<SubAdmin[]>([]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ defaultValues: { role: "admin" } });
  const load = () => getSubAdmins().then(setAdmins).catch(() => toast.error("Unable to load admin accounts"));

  useEffect(() => { if (user?.role === "super_admin") void load(); }, [user?.role]);

  if (user?.role !== "super_admin") {
    return <div className="panel rounded-3xl p-8 text-center"><ShieldCheck className="mx-auto text-slate-400"/><h1 className="mt-4 font-display text-2xl font-bold">Super-admin access required</h1><p className="mt-2 text-sm text-slate-500">Only a super admin can create or view subordinate admin accounts.</p></div>;
  }

  const submit = async (values: FormData) => {
    try {
      await createSubAdmin(values);
      toast.success("Sub-admin account created");
      reset({ name: "", email: "", password: "", role: "admin" });
      await load();
    } catch (error) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        const apiError = error.response?.data.error;
        const detail = apiError?.details?.[0];
        toast.error(detail?.field ? `${detail.field}: ${detail.message ?? "Invalid value"}` : apiError?.message ?? "Account could not be created");
        return;
      }
      toast.error("Account could not be created");
    }
  };

  return <div>
    <div><p className="text-xs font-extrabold tracking-[.2em] text-lime-700 uppercase dark:text-lime-300">Access control</p><h1 className="mt-2 font-display text-3xl font-bold tracking-[-.045em]">Admin accounts</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Create subordinate administrators and event managers. Super-admin access cannot be granted here.</p></div>
    <div className="mt-7 grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
      <form onSubmit={event => void handleSubmit(submit)(event)} className="panel rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-lime-300 text-ink-950"><UserPlus size={19}/></span><div><h2 className="font-display text-xl font-bold">Create sub-admin</h2><p className="text-xs text-slate-500">The account can sign in immediately.</p></div></div>
        <div className="mt-6 grid gap-4">
          <label className="text-sm font-bold">Full name<input className={field} placeholder="Admin name" {...register("name", { required: true, minLength: 2, maxLength: 120 })}/></label>
          <label className="text-sm font-bold">Email address<input type="email" className={field} placeholder="admin@example.edu" {...register("email", { required: true })}/></label>
          <label className="text-sm font-bold">Role<select className={field} {...register("role")}><option value="admin">Admin</option><option value="event_manager">Event manager</option></select></label>
          <label className="text-sm font-bold">Temporary password<input type="password" autoComplete="new-password" className={field} placeholder="At least 12 strong characters" {...register("password", { required: true, minLength: 12, maxLength: 128, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/ })}/><span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Use uppercase, lowercase, a number and a special character. Share it securely.</span></label>
        </div>
        {Object.keys(errors).length > 0 && <p className="mt-4 text-xs font-semibold text-rose-600">Complete all fields and use a strong 12-character password.</p>}
        <button disabled={isSubmitting} className="mt-6 h-11 w-full rounded-xl bg-ink-950 text-sm font-bold text-white hover:bg-lime-400 hover:text-ink-950 disabled:opacity-50 dark:bg-lime-300 dark:text-ink-950">{isSubmitting ? "Creating…" : "Create account"}</button>
      </form>
      <section><div className="flex items-end justify-between"><div><h2 className="font-display text-xl font-bold">Sub-admin directory</h2><p className="mt-1 text-xs text-slate-500">{admins.length} account{admins.length === 1 ? "" : "s"}</p></div></div><div className="mt-4 grid gap-3">{admins.length === 0 ? <div className="panel rounded-2xl p-10 text-center text-sm text-slate-500">No sub-admin accounts yet.</div> : admins.map(admin => <article key={admin._id} className="panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-white/8 dark:text-slate-200"><UserCog size={20}/></span><div className="min-w-0 flex-1"><p className="truncate font-bold">{admin.name}</p><p className="truncate text-sm text-slate-500">{admin.email}</p></div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-extrabold text-lime-800 uppercase dark:bg-lime-300/12 dark:text-lime-300">{admin.role.replace("_", " ")}</span><span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${admin.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300" : "bg-slate-200 text-slate-600"}`}>{admin.isActive ? "active" : "inactive"}</span></div></article>)}</div></section>
    </div>
  </div>;
};
