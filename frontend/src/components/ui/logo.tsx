import { ScanLine } from "lucide-react";
import { Link } from "react-router-dom";

export const Logo = () => (
  <Link to="/" className="focus-ring flex items-center gap-2.5 rounded-xl" aria-label="EventPass AI home">
    <span className="grid size-9 place-items-center rounded-xl bg-ink-950 text-mint-300 shadow-lg shadow-mint-400/15 dark:bg-mint-300 dark:text-ink-950">
      <ScanLine size={20} strokeWidth={2.4} />
    </span>
    <span className="font-display text-lg font-bold tracking-[-0.04em]">
      EventPass <span className="text-emerald-600 dark:text-mint-300">AI</span>
    </span>
  </Link>
);
