import { ArrowRight, BadgeCheck, QrCode, ScanFace, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/empty-state";
import { EventCard } from "../components/ui/event-card";
import { EventCardSkeleton } from "../components/ui/skeleton";
import { useUpcomingEvents } from "../hooks/use-upcoming-events";

const steps = [
  { icon: ScanFace, number: "01", title: "Verify your identity", text: "Submit your event details, selfie, and college ID through a secure registration flow." },
  { icon: BadgeCheck, number: "02", title: "Get reviewed", text: "Your event team verifies the registration and keeps its status easy to track." },
  { icon: QrCode, number: "03", title: "Scan and enter", text: "Use your unique event pass at the venue for a faster, paperless check-in." }
];

export const HomePage = () => {
  const { events, isLoading, error, retry } = useUpcomingEvents();

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-noise absolute inset-0" />
        <div className="absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-mint-300/20 blur-3xl dark:bg-mint-300/10" />
        <div className="page-shell relative grid min-h-[720px] items-center gap-12 py-20 lg:grid-cols-[1.08fr_.92fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800 dark:border-mint-300/20 dark:bg-mint-300/8 dark:text-mint-300">
              <Sparkles size={14} /> One pass. A smoother campus experience.
            </div>
            <h1 className="text-balance mt-7 font-display text-5xl leading-[.98] font-bold tracking-[-0.065em] text-ink-950 sm:text-6xl lg:text-7xl dark:text-white">
              Your campus entry, <span className="text-emerald-600 dark:text-mint-300">reimagined.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Discover events, register securely, and arrive with a verified digital pass—without paperwork or uncertainty.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/events" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink-950 px-6 text-sm font-bold text-white shadow-xl shadow-ink-950/15 transition hover:-translate-y-0.5 hover:bg-emerald-700 dark:bg-mint-300 dark:text-ink-950">
                Explore events <ArrowRight size={17} />
              </Link>
              <Link to="/track" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-6 text-sm font-bold text-ink-950 transition hover:border-emerald-400 dark:border-white/12 dark:bg-white/5 dark:text-white">
                Track registration
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600 dark:text-mint-300" /> Secure documents</span>
              <span className="flex items-center gap-2"><BadgeCheck size={17} className="text-emerald-600 dark:text-mint-300" /> Verifiable status</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-mint-300/25 to-sky-400/10 blur-2xl" />
            <div className="surface relative overflow-hidden rounded-[2rem] p-6 shadow-glow">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-800 uppercase dark:bg-mint-300/12 dark:text-mint-300">Digital access pass</span>
                <span className="size-2 rounded-full bg-mint-400 shadow-[0_0_0_6px_rgb(64_224_164_/_12%)]" />
              </div>
              <div className="mt-10 flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-2xl bg-ink-950 text-mint-300 dark:bg-mint-300 dark:text-ink-950"><ScanFace size={28} /></div>
                <div><p className="text-xs font-bold text-slate-500 uppercase">Identity</p><p className="mt-1 font-display text-xl font-bold">Student verified</p></div>
              </div>
              <div className="my-8 grid place-items-center rounded-3xl border border-slate-200 bg-white p-7 dark:border-white/10 dark:bg-white">
                <QrCode size={150} strokeWidth={1.25} className="text-ink-950" aria-label="Digital pass illustration" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-100 p-3 dark:bg-white/5"><p className="text-[10px] font-bold text-slate-500 uppercase">Status</p><p className="mt-1 font-bold text-emerald-700 dark:text-mint-300">Ready to scan</p></div>
                <div className="rounded-xl bg-slate-100 p-3 dark:bg-white/5"><p className="text-[10px] font-bold text-slate-500 uppercase">Access</p><p className="mt-1 font-bold">Single event</p></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="page-shell py-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-xs font-extrabold tracking-[.2em] text-emerald-700 uppercase dark:text-mint-300">Coming up</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-.045em] sm:text-4xl">Find your next campus moment.</h2></div>
          <Link to="/events" className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-mint-300">View all events <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 3 }).map((_, index) => <EventCardSkeleton key={index} />)}
          {!isLoading && error && <EmptyState title="Events are temporarily unavailable" message={error} onRetry={() => void retry()} />}
          {!isLoading && !error && events.length === 0 && <EmptyState title="No upcoming events yet" message="Published college events will appear here as soon as registration opens." />}
          {!isLoading && !error && events.slice(0, 3).map((event, index) => <EventCard key={event._id} event={event} index={index} />)}
        </div>
      </section>

      <section className="border-y border-slate-200/70 bg-white/65 py-24 dark:border-white/8 dark:bg-white/[0.025]">
        <div className="page-shell">
          <div className="max-w-2xl"><p className="text-xs font-extrabold tracking-[.2em] text-emerald-700 uppercase dark:text-mint-300">How it works</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-.045em] sm:text-4xl">From interest to entry in three clear steps.</h2></div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {steps.map((step, index) => (
              <motion.article key={step.number} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .1 }} className="surface rounded-3xl p-7">
                <div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-mint-300/10 dark:text-mint-300"><step.icon /></span><span className="font-display text-3xl font-bold text-slate-200 dark:text-white/10">{step.number}</span></div>
                <h3 className="mt-7 font-display text-xl font-bold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
