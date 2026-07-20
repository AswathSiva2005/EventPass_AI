import { EmptyState } from "../components/ui/empty-state";
import { EventCard } from "../components/ui/event-card";
import { PageHeading } from "../components/ui/page-heading";
import { EventCardSkeleton } from "../components/ui/skeleton";
import { useUpcomingEvents } from "../hooks/use-upcoming-events";

export const EventsPage = () => {
  const { events, isLoading, error, retry } = useUpcomingEvents();
  return (
    <section className="page-shell min-h-[70vh] py-16 sm:py-24">
      <PageHeading eyebrow="Discover" title="Upcoming college events" description="Browse events currently open for student registration and reserve your verified entry pass." />
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, index) => <EventCardSkeleton key={index} />)}
        {!isLoading && error && <EmptyState title="Events are temporarily unavailable" message={error} onRetry={() => void retry()} />}
        {!isLoading && !error && events.length === 0 && <EmptyState title="No registrations are open" message="There are no published upcoming events right now. Check back when your college announces the next event." />}
        {!isLoading && !error && events.map((event, index) => <EventCard key={event._id} event={event} index={index} />)}
      </div>
    </section>
  );
};
