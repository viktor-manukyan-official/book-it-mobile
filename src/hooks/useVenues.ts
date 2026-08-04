import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchVenues } from "../services/catalogApi";
import type { VenueCard } from "../types/catalog";

export type VenueSort = "relevance" | "rating" | "distance";

export interface VenueQuery {
  search: string;
  openNow: boolean;
  sort: VenueSort;
}

interface VenuesState {
  venues: VenueCard[];
  page: number;
  totalPages: number;
  totalItems: number;
  loading: boolean; // first page (spinner replaces the list)
  loadingMore: boolean; // appending a subsequent page
  refreshing: boolean;
  error: string | null;
}

const DEBOUNCE_MS = 350;
const PAGE_SIZE = 30;

const INITIAL: VenuesState = {
  venues: [],
  page: 0,
  totalPages: 0,
  totalItems: 0,
  loading: true,
  loadingMore: false,
  refreshing: false,
  error: null,
};

/**
 * Loads venues for the discovery list from the `venues` API (BOOK-56).
 * Search text is debounced and sent server-side (matching company name AND the
 * services a company offers); pages are appended via loadMore() for infinite
 * scroll. "Top rated" / "Nearby" are client-side sorts over the loaded pages.
 */
export function useVenues(query: VenueQuery) {
  const [state, setState] = useState<VenuesState>(INITIAL);

  // Guards against races: only the latest query's responses are applied.
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
        const result = await fetchVenues(
          {
            search: query.search.trim() || undefined,
            openNow: query.openNow || undefined,
          },
          { page, limit: PAGE_SIZE },
        );
        if (id !== requestId.current) return; // superseded
        setState((s) => ({
          venues: page === 1 ? result.items : [...s.venues, ...result.items],
          page: result.meta.currentPage,
          totalPages: result.meta.totalPages,
          totalItems: result.meta.totalItems,
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
          error: err instanceof Error ? err.message : "Something went wrong.",
        }));
      }
    },
    [query.search, query.openNow],
  );

  // Debounce first-page loads so typing doesn't fire a request per keystroke.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void loadPage(1, "initial"), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [loadPage]);

  const loadMore = useCallback(() => {
    setState((s) => {
      if (s.loading || s.loadingMore || s.refreshing) return s;
      if (s.page >= s.totalPages) return s; // no more pages
      void loadPage(s.page + 1, "more");
      return s;
    });
  }, [loadPage]);

  // "Top rated" / "Nearby" sort the loaded pages without a new request.
  const venues = useMemo(() => {
    const list = [...state.venues];
    if (query.sort === "rating") {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (query.sort === "distance") {
      list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }
    return list;
  }, [state.venues, query.sort]);

  const hasMore = state.page > 0 && state.page < state.totalPages;

  return {
    ...state,
    venues,
    hasMore,
    loadMore,
    refresh: () => loadPage(1, "refresh"),
    retry: () => loadPage(1, "initial"),
  };
}
