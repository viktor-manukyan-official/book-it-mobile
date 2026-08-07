import { useCallback, useEffect, useRef, useState } from "react";

import { fetchMyBookings } from "../services/bookingApi";
import type { BookingListItem } from "../types/catalog";

export type BookingScope = "upcoming" | "past";
const PAGE_SIZE = 20;

interface State {
  items: BookingListItem[];
  page: number;
  totalPages: number;
  loading: boolean; // first page / tab switch (skeletons)
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
}

const INITIAL: State = {
  items: [],
  page: 0,
  totalPages: 0,
  loading: true,
  loadingMore: false,
  refreshing: false,
  error: null,
};

/**
 * Loads the customer's bookings for the active tab with infinite scroll,
 * pull-to-refresh and focus re-query (BOOK-75).
 */
export function useMyBookings(scope: BookingScope) {
  const [state, setState] = useState<State>(INITIAL);
  const requestId = useRef(0);

  const loadPage = useCallback(
    async (page: number, mode: "initial" | "refresh" | "more") => {
      const id = ++requestId.current;
      setState((s) => ({
        ...s,
        loading: mode === "initial",
        refreshing: mode === "refresh",
        loadingMore: mode === "more",
        error: null,
      }));
      try {
        const res = await fetchMyBookings(scope, page, PAGE_SIZE);
        if (id !== requestId.current) return;
        setState((s) => ({
          items: page === 1 ? res.items : [...s.items, ...res.items],
          page: res.meta.currentPage,
          totalPages: res.meta.totalPages,
          loading: false,
          loadingMore: false,
          refreshing: false,
          error: null,
        }));
      } catch (err) {
        if (id !== requestId.current) return;
        setState((s) => ({
          ...s,
          loading: false,
          loadingMore: false,
          refreshing: false,
          error: err instanceof Error ? err.message : "Could not load your bookings.",
        }));
      }
    },
    [scope],
  );

  // Load first page on mount and whenever the tab (scope) changes.
  useEffect(() => {
    const t = setTimeout(() => void loadPage(1, "initial"), 0);
    return () => clearTimeout(t);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    setState((s) => {
      if (s.loading || s.loadingMore || s.refreshing) return s;
      if (s.page >= s.totalPages) return s;
      void loadPage(s.page + 1, "more");
      return s;
    });
  }, [loadPage]);

  const refresh = useCallback(() => loadPage(1, "refresh"), [loadPage]);

  const hasMore = state.page > 0 && state.page < state.totalPages;

  return { ...state, hasMore, loadMore, refresh, retry: () => loadPage(1, "initial") };
}
