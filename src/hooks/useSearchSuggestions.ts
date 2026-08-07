import { useCallback, useEffect, useRef, useState } from "react";

import { fetchSearchSuggestions } from "../services/catalogApi";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
} from "../services/recentSearches";
import type { SearchSuggestions } from "../types/catalog";

const DEBOUNCE_MS = 250;
const EMPTY: SearchSuggestions = { services: [], venues: [] };

/**
 * Owns the Search screen's query, its debounced + race-safe suggestion fetch,
 * and the per-user recent searches (BOOK-68). Suggestions begin at the first
 * character; recents are recorded only via recordTapThrough().
 */
export function useSearchSuggestions(userId: string | null) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestions>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);

  const requestId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted recents once the user id is known.
  useEffect(() => {
    let active = true;
    void getRecentSearches(userId).then((list) => {
      if (active) setRecents(list);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const trimmed = query.trim();

  // All state updates run inside the timer (never synchronously in the effect
  // body), so a fast typist's earlier responses are dropped by requestId.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const id = ++requestId.current;

    if (trimmed.length === 0) {
      // Empty query: clear on the next tick, no fetch.
      timer.current = setTimeout(() => {
        if (id !== requestId.current) return;
        setSuggestions(EMPTY);
        setLoading(false);
      }, 0);
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }

    timer.current = setTimeout(() => {
      if (id !== requestId.current) return;
      setLoading(true);
      void fetchSearchSuggestions(trimmed)
        .then((result) => {
          if (id !== requestId.current) return; // superseded by a newer query
          setSuggestions(result);
          setLoading(false);
        })
        .catch(() => {
          if (id !== requestId.current) return;
          setSuggestions(EMPTY);
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [trimmed]);

  const recordTapThrough = useCallback(async () => {
    if (!trimmed) return;
    const updated = await addRecentSearch(userId, trimmed);
    setRecents(updated);
  }, [userId, trimmed]);

  const clearRecents = useCallback(async () => {
    await clearRecentSearches(userId);
    setRecents([]);
  }, [userId]);

  const hasQuery = trimmed.length > 0;
  const hasResults =
    suggestions.services.length > 0 || suggestions.venues.length > 0;
  const noResults = hasQuery && !loading && !hasResults;

  return {
    query,
    setQuery,
    clear: () => setQuery(""),
    trimmed,
    suggestions,
    loading,
    hasQuery,
    hasResults,
    noResults,
    recents,
    recordTapThrough,
    clearRecents,
  };
}
