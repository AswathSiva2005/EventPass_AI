export const StatusPill = ({ status }: { status: string }) => {
  const positive = ["approved", "checked_in", "checked_out"].includes(status);
  const negative = ["rejected", "absent", "cancelled"].includes(status);
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold tracking-wide uppercase ${
        positive
          ? "bg-emerald-100 text-emerald-800 dark:bg-mint-300/15 dark:text-mint-300"
          : negative
            ? "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300"
            : "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
};
