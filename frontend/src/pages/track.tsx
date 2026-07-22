import { CalendarDays, Download, MapPin, QrCode, Search, TicketCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { downloadRegistrationPass, trackRegistration } from "../api/student";
import { Button } from "../components/ui/button";
import { PageHeading } from "../components/ui/page-heading";
import { StatusPill } from "../components/ui/status-pill";
import type { RegistrationStatus } from "../types/api";
import { getErrorMessage } from "../utils/errors";
import { formatEventDate } from "../utils/format";

export const TrackPage = () => {
  const [result, setResult] = useState<RegistrationStatus>();
  const [downloading, setDownloading] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ registrationId: string }>();

  const submit = async ({ registrationId }: { registrationId: string }) => {
    try {
      setResult(await trackRegistration(registrationId.trim().toUpperCase()));
    } catch (error) {
      setResult(undefined);
      toast.error(getErrorMessage(error, "Registration was not found."));
    }
  };

  const downloadPass = async () => {
    if (!result) return;
    try {
      setDownloading(true);
      await downloadRegistrationPass(result.registrationId);
      toast.success("Event pass downloaded");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to download the event pass."));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="page-shell min-h-[72vh] py-16 sm:py-24">
      <PageHeading eyebrow="Live status" title="Track your registration" description="Enter the registration ID issued after submission to see verification and attendance details." />
      <form onSubmit={(event) => void handleSubmit(submit)(event)} className="surface mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={19} />
          <input
            aria-label="Registration ID"
            autoCapitalize="characters"
            className="focus-ring h-12 w-full rounded-xl border border-transparent bg-slate-50 pr-4 pl-12 font-mono text-sm font-bold uppercase dark:bg-white/5"
            placeholder="Enter registration ID"
            {...register("registrationId", { required: "Registration ID is required", minLength: { value: 6, message: "Enter a valid registration ID" } })}
          />
        </div>
        <Button type="submit" loading={isSubmitting}>Track status</Button>
      </form>
      {errors.registrationId?.message && <p className="mx-auto mt-2 max-w-2xl text-xs font-semibold text-rose-600">{errors.registrationId.message}</p>}

      {result && (
        <motion.article initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="surface mx-auto mt-8 max-w-2xl rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start dark:border-white/10">
            <div><p className="text-xs font-bold tracking-wider text-emerald-700 uppercase dark:text-mint-300">{result.registrationId}</p><h2 className="mt-2 font-display text-2xl font-bold">{result.eventName}</h2><p className="mt-1 text-sm text-slate-500">{result.studentName}</p></div>
            <StatusPill status={result.verificationStatus} />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-white/5"><p className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><TicketCheck size={15} /> Attendance</p><div className="mt-3"><StatusPill status={result.attendanceStatus} /></div></div>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-white/5"><p className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><MapPin size={15} /> Venue</p><p className="mt-3 text-sm font-bold">{result.venue}</p></div>
            <div className="rounded-2xl bg-slate-100 p-4 sm:col-span-2 dark:bg-white/5"><p className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><CalendarDays size={15} /> Event begins</p><p className="mt-3 text-sm font-bold">{formatEventDate(result.eventStartsAt)}</p></div>
          </div>
          {result.qrCode?.imageUrl && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-white/10">
              <p className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 uppercase">
                <QrCode size={16} /> Event QR pass
              </p>
              <img
                src={result.qrCode.imageUrl}
                alt={`QR pass for ${result.registrationId}`}
                className="mx-auto mt-4 size-52 rounded-2xl border border-slate-200 bg-white p-3"
              />
              <p className="mt-3 font-mono text-xs font-bold text-slate-600">{result.registrationId}</p>
              <p className="mt-2 text-xs text-slate-500">Present this QR code to the volunteer at the event entrance.</p>
              <Button type="button" variant="secondary" loading={downloading} onClick={() => void downloadPass()} className="mt-5 w-full sm:w-auto" style={{color:'black'}}><Download size={17} /> Download pass PDF</Button>
            </div>
          )}
          <p className="mt-5 text-xs text-slate-500">Last updated {formatEventDate(result.updatedAt)}</p>
        </motion.article>
      )}
    </section>
  );
};
