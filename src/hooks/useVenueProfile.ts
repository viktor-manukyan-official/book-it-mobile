import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "./useAuth";
import { fetchVenue, notifyWhenBookingOpens } from "../services/catalogApi";
import { getFavourites, toggleFavourite } from "../services/favourites";
import type { VenueDetail } from "../types/catalog";

type NotifyState = "idle" | "sending" | "done";

interface State {
  venue: VenueDetail | null;
  loading: boolean;
  error: string | null;
}

/**
 * Loads a venue profile and owns its favourite toggle (persisted per user, with
 * an optimistic update) and the empty-state "Notify me" action (BOOK-70).
 */
export function useVenueProfile(id: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [state, setState] = useState<State>({ venue: null, loading: true, error: null });
  const [favourite, setFavourite] = useState(false);
  const [notify, setNotify] = useState<NotifyState>("idle");

  const requestId = useRef(0);

  useEffect(() => {
    if (!id) return;
    const load = setTimeout(() => {
      const rid = ++requestId.current;
      void fetchVenue(id)
        .then((venue) => {
          if (rid !== requestId.current) return;
          setState({ venue, loading: false, error: null });
        })
        .catch((err: unknown) => {
          if (rid !== requestId.current) return;
          setState({
            venue: null,
            loading: false,
            error: err instanceof Error ? err.message : "Something went wrong.",
          });
        });
    }, 0);
    return () => clearTimeout(load);
  }, [id]);

  // Load persisted favourite state for this venue.
  useEffect(() => {
    if (!id) return;
    let active = true;
    void getFavourites(userId).then((list) => {
      if (active) setFavourite(list.includes(id));
    });
    return () => {
      active = false;
    };
  }, [id, userId]);

  const toggleFav = useCallback(() => {
    if (!id) return;
    setFavourite((v) => !v); // optimistic
    void toggleFavourite(userId, id).then((list) => setFavourite(list.includes(id)));
  }, [id, userId]);

  const registerNotify = useCallback(async () => {
    if (!state.venue || notify !== "idle") return;
    setNotify("sending");
    try {
      await notifyWhenBookingOpens(state.venue.id);
      setNotify("done");
    } catch {
      setNotify("idle");
    }
  }, [state.venue, notify]);

  const retry = useCallback(() => {
    if (!id) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    const rid = ++requestId.current;
    void fetchVenue(id)
      .then((venue) => {
        if (rid !== requestId.current) return;
        setState({ venue, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (rid !== requestId.current) return;
        setState({
          venue: null,
          loading: false,
          error: err instanceof Error ? err.message : "Something went wrong.",
        });
      });
  }, [id]);

  return {
    venue: state.venue,
    loading: state.loading,
    error: state.error,
    favourite,
    toggleFav,
    notify,
    registerNotify,
    retry,
  };
}
