import { useCallback, useEffect, useRef, useState } from "react";

import { fetchExploreVenues } from "../services/catalogApi";
import type { ExploreFilter, VenueCard, VenueCategory } from "../types/catalog";

export interface ExploreQuery {
  search: string;
  openNow: boolean;
  topRated: boolean;
  categoryId: string | null;
  city: string;
}

// Rating threshold for the "Top rated" filter (BOOK-69).
const TOP_RATED_MIN = 4.5;
const DEBOUNCE_MS = 350;
const PAGE_SIZE = 20;

interface State {
  venues: VenueCard[];
  categories: VenueCategory[]; // facet chips, from the latest fresh query
  page: number;
  totalPages: number;
  totalItems: number;
  loading: boolean; // first page / re-query (skeletons)
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
}

const INITIAL: State = {
  venues: [],
  categories: [],
  page: 0,
  totalPages: 0,
  totalItems: 0,
  loading: true,
  loadingMore: false,
  refreshing: false,
  error: null,
};

function toFilter(q: ExploreQuery): ExploreFilter {
  return {
    search: q.search.trim() || undefined,
    city: q.city || undefined,
    openNow: q.openNow || undefined,
    categoryId: q.categoryId ?? undefined,
    minRating: q.topRated ? TOP_RATED_MIN : undefined,
    sort: q.topRated ? "rating" : undefined,
  };
}

/**
 * Explore results: debounced query, category-facet chips, and paged infinite
 * scroll (BOOK-69). Facets come from the latest fresh (page-1) response so the
 * chips reflect the current query/filters.
 */
export function useExploreVenues(query: ExploreQuery) {
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
        const result = await fetchExploreVenues(toFilter(query), { page, limit: PAGE_SIZE });
        if (id !== requestId.current) return; // superseded
        setState((s) => ({
          venues: page === 1 ? result.items : [...s.venues, ...result.items],
          // Keep facets stable while paginating; refresh them on a fresh query.
          categories: mode === "more" ? s.categories : result.categories,
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
    [query],
  );

  // Debounce first-page loads; any filter/query change re-runs from page 1.
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
      if (s.page >= s.totalPages) return s;
      void loadPage(s.page + 1, "more");
      return s;
    });
  }, [loadPage]);

  const hasMore = state.page > 0 && state.page < state.totalPages;

  return {
    ...state,
    hasMore,
    loadMore,
    refresh: () => loadPage(1, "refresh"),
    retry: () => loadPage(1, "initial"),
  };
}
