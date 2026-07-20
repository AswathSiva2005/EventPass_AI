import { ArrowRight, CheckCircle2, Copy, QrCode } from "lucide-react";
import { motion } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { StatusPill } from "../components/ui/status-pill";
import type { RegistrationResult } from "../types/api";

const isRegistrationResult = (value: unknown): value is RegistrationResult =>
  typeof value === "object" &&
  value !== null &&
  "registrationId" in value &&
  typeof value.registrationId === "string";

export const RegistrationSuccessPage = () => {
  const location = useLocation();
  const registration = isRegistrationResult(location.state) ? location.state : null;

  if (!registration?.registrationId) {
    return (
      <section className="page-shell grid min-h-[65vh] place-items-center py-20">
        <div className="surface max-w-lg rounded-3xl p-8 text-center">
          <QrCode className="mx-auto text-emerald-700 dark:text-mint-300" size={42} />
          <h1 className="mt-5 font-display text-2xl font-bold">Looking for your registration?</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">For privacy, success details are only shown immediately after submission. Use your registration ID to retrieve the latest status.</p>
          <Link to="/track" className="focus-ring mt-6 inline-flex items-center gap-2 rounded-xl bg-ink-950 px-5 py-3 text-sm font-bold text-white dark:bg-mint-300 dark:text-ink-950">Track registration <ArrowRight size={16} /></Link>
        </div>
      </section>
    );
  }

  const copyId = async () => {
    await navigator.clipboard.writeText(registration.registrationId);
    toast.success("Registration ID copied");
  };

  return (
    <section className="page-shell grid min-h-[72vh] place-items-center py-16">
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="surface w-full max-w-2xl overflow-hidden rounded-[2rem]">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-10 text-center text-white dark:from-emerald-900 dark:to-ink-950">
          <CheckCircle2 className="mx-auto text-mint-300" size={52} />
          <h1 className="mt-5 font-display text-3xl font-bold tracking-[-.04em]">Registration received</h1>
          <p className="mt-2 text-sm text-emerald-50">Keep your registration ID safe while the event team reviews your documents.</p>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-7 sm:flex-row">
            {registration.qrCode?.imageUrl ? (
              <img src={registration.qrCode.imageUrl} alt="Event registration QR code" className="size-44 rounded-2xl border border-slate-200 bg-white p-3" />
            ) : (
              <div className="grid size-44 shrink-0 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center dark:border-white/15 dark:bg-white/5">
                <div><QrCode className="mx-auto text-slate-400" size={42} /><p className="mt-2 px-4 text-xs text-slate-500">QR appears after generation</p></div>
              </div>
            )}
            <div className="w-full">
              <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Registration ID</p>
              <button type="button" onClick={() => void copyId()} className="focus-ring mt-2 flex w-full items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-left font-mono text-sm font-bold text-ink-950 dark:bg-white/6 dark:text-white">
                {registration.registrationId}<Copy size={16} />
              </button>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-500">Student</p><p className="mt-1 text-sm font-bold">{registration.studentName}</p></div>
                <div><p className="text-xs text-slate-500">Verification</p><div className="mt-1"><StatusPill status={registration.verificationStatus} /></div></div>
                <div className="col-span-2"><p className="text-xs text-slate-500">Event</p><p className="mt-1 text-sm font-bold">{registration.eventName}</p></div>
              </div>
            </div>
          </div>
          <Link to="/track" className="focus-ring mt-8 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink-950 px-5 text-sm font-bold text-white dark:bg-mint-300 dark:text-ink-950">Track this registration <ArrowRight size={17} /></Link>
        </div>
      </motion.div>
    </section>
  );
};
