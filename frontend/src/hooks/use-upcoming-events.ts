import { useCallback, useEffect, useState } from "react";
import { getUpcomingEvents } from "../api/student";
import type { Event } from "../types/api";
import { getErrorMessage } from "../utils/errors";

export const useUpcomingEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setEvents(await getUpcomingEvents());
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load upcoming events."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getUpcomingEvents()
      .then((items) => {
        if (active) setEvents(items);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError, "Unable to load upcoming events."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { events, isLoading, error, retry: load };
};
