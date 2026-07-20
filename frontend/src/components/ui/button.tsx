import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}

export const Button = ({
  children,
  loading = false,
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  const variants = {
    primary:
      "bg-ink-950 text-white shadow-lg shadow-ink-950/15 hover:-translate-y-0.5 hover:bg-emerald-700 dark:bg-mint-300 dark:text-ink-950 dark:hover:bg-mint-400",
    secondary:
      "border border-slate-200 bg-white text-ink-950 hover:border-emerald-400 hover:bg-emerald-50 dark:border-white/12 dark:bg-white/5 dark:text-white dark:hover:bg-mint-300/10",
    ghost:
      "text-slate-600 hover:bg-slate-100 hover:text-ink-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
  };

  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle size={17} className="animate-spin" />}
      {children}
    </button>
  );
};
