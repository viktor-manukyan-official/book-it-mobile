import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchHomeVenue, notifyWhenBookingOpens } from "../services/catalogApi";
import { getLastVenueId, setLastVenueId } from "../services/lastVenue";
import type { ServiceLite, VenueDetail } from "../types/catalog";

// Grouping label shown in the service-list header when no category is selected.
export const ALL_GROUP_LABEL = "Popular";

type NotifyState = "idle" | "sending" | "done";

interface State {
  venue: VenueDetail | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const INITIAL: State = { venue: null, loading: true, refreshing: false, error: null };

/**
 * Loads the customer Home venue (the last-viewed venue, else the backend
 * default) plus its categories and bookable services, and owns the in-place
 * category filter and the empty-state "Notify me" action (BOOK-67).
 */
export function useHomeVenue() {
  const [state, setState] = useState<State>(INITIAL);
  // null = the "All" group. May reference a category that no longer exists after
  // a refresh — resolved to a valid selection in `effectiveCategoryId` below.
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [notify, setNotify] = useState<NotifyState>("idle");

  const requestId = useRef(0);

  // Fetch happens only after the first await, so no setState runs synchronously
  // (initial pre-load state comes from INITIAL / the refresh & retry handlers).
  const runLoad = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const lastId = await getLastVenueId();
      const venue = await fetchHomeVenue(lastId ?? undefined);
      if (id !== requestId.current) return;
      void setLastVenueId(venue.id);
      setState({ venue, loading: false, refreshing: false, error: null });
    } catch (err) {
      if (id !== requestId.current) return;
      setState({
        venue: null,
        loading: false,
        refreshing: false,
        error: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }, []);

  // Deferred a tick so the fetch's setState doesn't run synchronously inside
  // the effect body (same pattern as useVenues).
  useEffect(() => {
    const t = setTimeout(() => void runLoad(), 0);
    return () => clearTimeout(t);
  }, [runLoad]);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, refreshing: true, error: null }));
    void runLoad();
  }, [runLoad]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    void runLoad();
  }, [runLoad]);

  const categories = state.venue?.categories ?? [];
  const services = useMemo<ServiceLite[]>(
    () => state.venue?.services ?? [],
    [state.venue],
  );

  // A selection that no longer exists (post-refresh) collapses to "All".
  const effectiveCategoryId =
    selectedCategoryId && categories.some((c) => c.id === selectedCategoryId)
      ? selectedCategoryId
      : null;

  const filteredServices = useMemo(
    () =>
      effectiveCategoryId
        ? services.filter((s) => s.categoryId === effectiveCategoryId)
        : services,
    [services, effectiveCategoryId],
  );

  const groupLabel = effectiveCategoryId
    ? (categories.find((c) => c.id === effectiveCategoryId)?.name ?? ALL_GROUP_LABEL)
    : ALL_GROUP_LABEL;

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

  return {
    venue: state.venue,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    categories,
    selectedCategoryId: effectiveCategoryId,
    selectCategory: setSelectedCategoryId,
    filteredServices,
    groupLabel,
    hasServices: services.length > 0,
    notify,
    registerNotify,
    refresh,
    retry,
  };
}
