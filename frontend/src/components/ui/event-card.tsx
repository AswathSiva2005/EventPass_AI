import { ArrowUpRight, Clock3, MapPin, Users } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import type { Event } from "../../types/api";
import { eventDateParts, formatEventDate } from "../../utils/format";

export const EventCard = ({ event, index = 0 }: { event: Event; index?: number }) => {
  const date = eventDateParts(event.startsAt);
  const college =
    event.college && typeof event.college !== "string" ? event.college.name : null;
  const highlights = event.highlights ?? [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.07 }}
      className="surface group overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:shadow-glow"
    >
      {event.banner?.url && (
        <img src={event.banner.url} alt={event.name} className="h-40 w-full object-cover" />
      )}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="grid min-w-16 place-items-center rounded-2xl bg-emerald-50 px-3 py-3 text-center dark:bg-mint-300/10">
            <span className="text-[11px] font-extrabold tracking-wider text-emerald-700 dark:text-mint-300">
              {date.month}
            </span>
            <span className="font-display text-2xl font-bold text-ink-950 dark:text-white">{date.day}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-wider text-emerald-700 uppercase dark:text-mint-300">
              {event.code}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.035em] text-ink-950 dark:text-white">
              {event.name}
            </h2>
            {college && <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{college}</p>}
          </div>
        </div>
        <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {event.description}
        </p>
        {highlights.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold tracking-wide text-emerald-700 uppercase dark:text-mint-300">What&apos;s happening</p>
              <p className="flex shrink-0 items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Users size={13} />
                {event.teamSize === 1 ? "1 person" : `${event.teamSize ?? 1} people`}
              </p>
            </div>
            <div className="mt-2 grid gap-2">
              {highlights.slice(0, 3).map((highlight, highlightIndex) => (
                <div
                  key={highlight._id ?? highlightIndex}
                  className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2 dark:bg-mint-300/10"
                >
                  {highlight.image?.url && (
                    <img
                      src={highlight.image.url}
                      alt={highlight.title}
                      className="size-10 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-emerald-800 dark:text-mint-300">{highlight.title}</p>
                    {highlight.description && (
                      <p className="truncate text-[11px] text-slate-600 dark:text-slate-300">{highlight.description}</p>
                    )}
                  </div>
                </div>
              ))}
              {highlights.length > 3 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  +{highlights.length - 3} more on the registration page
                </p>
              )}
            </div>
          </div>
        )}
        <div className="mt-5 space-y-2 border-t border-slate-200/70 pt-4 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
          <p className="flex items-center gap-2"><Clock3 size={15} />{formatEventDate(event.startsAt)}</p>
          <p className="flex items-center gap-2"><MapPin size={15} />{event.venue?.name || "Venue to be announced"}</p>
        </div>
        <Link
          to={`/register?event=${event._id}`}
          className="focus-ring mt-5 flex items-center justify-between rounded-xl bg-ink-950 px-4 py-3 text-sm font-bold text-white transition group-hover:bg-emerald-700 dark:bg-white/8 dark:group-hover:bg-mint-300 dark:group-hover:text-ink-950"
        >
          Register for event <ArrowUpRight size={17} />
        </Link>
      </div>
    </motion.article>
  );
};
