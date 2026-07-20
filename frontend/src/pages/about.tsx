import { CheckCircle2, Eye, LockKeyhole, ScanLine, Users } from "lucide-react";
import { motion } from "motion/react";
import { PageHeading } from "../components/ui/page-heading";

const principles = [
  { icon: LockKeyhole, title: "Privacy-conscious", text: "Identity documents are collected only for event verification and handled through protected services." },
  { icon: Eye, title: "Status transparency", text: "Students can follow their registration state without repeated calls or uncertain paperwork." },
  { icon: Users, title: "Human-led decisions", text: "Event teams remain responsible for approvals while technology makes their workflow consistent." }
];

export const AboutPage = () => (
  <section className="page-shell py-16 sm:py-24">
    <PageHeading eyebrow="About us" title="Designed for the reality of busy college events" description="EventPass AI brings registration, identity verification, entry credentials, and attendance into one coherent visitor journey." />
    <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="surface rounded-[2rem] p-7 sm:p-9">
        <span className="grid size-12 place-items-center rounded-2xl bg-ink-950 text-mint-300 dark:bg-mint-300 dark:text-ink-950"><ScanLine /></span>
        <h2 className="mt-7 font-display text-3xl font-bold tracking-[-.045em]">Less waiting. Better verification. Clearer records.</h2>
        <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">Paper lists and disconnected forms make event entry slow and difficult to audit. EventPass creates a single registration record that follows each visitor from submission through verification, scan, entry, and exit.</p>
        <ul className="mt-7 grid gap-3 text-sm font-semibold">
          {["Event-specific registrations", "Unique QR and barcode credentials", "Real-time attendance state", "Traceable volunteer actions"].map((item) => <li key={item} className="flex items-center gap-3"><CheckCircle2 size={17} className="text-emerald-600 dark:text-mint-300" />{item}</li>)}
        </ul>
      </motion.div>
      <div className="grid gap-4">
        {principles.map((principle, index) => (
          <motion.article key={principle.title} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className="surface flex gap-4 rounded-2xl p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-mint-300/10 dark:text-mint-300"><principle.icon size={20} /></span>
            <div><h3 className="font-display text-lg font-bold">{principle.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{principle.text}</p></div>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);
