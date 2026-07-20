import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTheme } from "../../hooks/use-theme";
import { Logo } from "../ui/logo";

const navItems = [
  { to: "/events", label: "Events" },
  { to: "/track", label: "Track" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" }
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#f7faf9]/85 backdrop-blur-xl dark:border-white/8 dark:bg-ink-950/85">
      <div className="page-shell flex h-18 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `focus-ring rounded-lg px-3.5 py-2 text-sm font-bold transition ${
                  isActive
                    ? "bg-emerald-100 text-emerald-800 dark:bg-mint-300/12 dark:text-mint-300"
                    : "text-slate-600 hover:text-ink-950 dark:text-slate-300 dark:hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="focus-ring grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:text-ink-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            to="/register"
            className="focus-ring hidden rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 sm:block dark:bg-mint-300 dark:text-ink-950 dark:hover:bg-mint-400"
          >
            Get your pass
          </Link>
          <button
            onClick={() => setOpen((value) => !value)}
            className="focus-ring grid size-10 place-items-center rounded-xl md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="page-shell grid gap-1 border-t border-slate-200/70 py-3 md:hidden dark:border-white/8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/register"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-xl bg-ink-950 px-4 py-3 text-center text-sm font-bold text-white dark:bg-mint-300 dark:text-ink-950"
          >
            Get your pass
          </Link>
        </nav>
      )}
    </header>
  );
};
