import { Link } from "react-router-dom";
import { Logo } from "../ui/logo";

export const Footer = () => (
  <footer className="border-t border-slate-200/80 bg-white/60 dark:border-white/8 dark:bg-white/[0.02]">
    <div className="page-shell grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
      <div>
        <Logo />
        <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
          Secure, paperless visitor verification for better college events—from registration to the final scan.
        </p>
      </div>
      <div>
        <p className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">Navigate</p>
        <div className="mt-4 grid gap-3 text-sm">
          <Link to="/events" className="hover:text-emerald-700 dark:hover:text-mint-300">Upcoming events</Link>
          <Link to="/track" className="hover:text-emerald-700 dark:hover:text-mint-300">Track registration</Link>
          <Link to="/about" className="hover:text-emerald-700 dark:hover:text-mint-300">About EventPass</Link>
        </div>
      </div>
      <div>
        <p className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">Support</p>
        <div className="mt-4 grid gap-3 text-sm">
          <Link to="/contact" className="hover:text-emerald-700 dark:hover:text-mint-300">Contact the team</Link>
          <Link to="/register" className="hover:text-emerald-700 dark:hover:text-mint-300">Create a pass</Link>
        </div>
      </div>
    </div>
    <div className="border-t border-slate-200/70 py-5 text-center text-xs text-slate-500 dark:border-white/8">
      © {new Date().getFullYear()} EventPass AI. Built for safer campus experiences.
    </div>
  </footer>
);
