import { motion } from "motion/react";

export const PageHeading = ({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    className="mx-auto max-w-3xl text-center"
  >
    <p className="mb-4 text-xs font-extrabold tracking-[0.24em] text-emerald-700 uppercase dark:text-mint-300">
      {eyebrow}
    </p>
    <h1 className="text-balance font-display text-4xl font-bold tracking-[-0.055em] text-ink-950 sm:text-5xl dark:text-white">
      {title}
    </h1>
    <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
      {description}
    </p>
  </motion.div>
);
