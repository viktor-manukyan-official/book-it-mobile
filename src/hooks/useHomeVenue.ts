import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchHomeVenue, notifyWhenBookingOpens } from "../services/catalogApi";
import { getLastVenueId, setLastVenueId } from "../services/lastVenue";
import type { ServiceLite, VenueCategory, VenueDetail } from "../types/catalog";

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
  // Two-level category filter (BOOK-83): a primary (top-level) category is always
  // selected; the subcategory is null = "All" within that primary.
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  // Multi-select advanced filter (BOOK-84): a set of subcategory ids. When
  // non-empty it overrides the single-select primary/sub chips.
  const [filterSubIds, setFilterSubIds] = useState<string[]>([]);
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

  const services = useMemo<ServiceLite[]>(() => state.venue?.services ?? [], [state.venue]);
  const categories = useMemo<VenueCategory[]>(
    () => state.venue?.categories ?? [],
    [state.venue],
  );

  // The primary (top-level) category a leaf category belongs to. A service whose
  // category has no parent is itself a primary.
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const primaryIdOf = useCallback(
    (categoryId?: string | null): string | null => {
      if (!categoryId) return null;
      const leaf = catById.get(categoryId);
      return leaf?.parentId ?? leaf?.id ?? null;
    },
    [catById],
  );

  // Primaries actually offered (have ≥1 service in their subtree), in category order.
  const primaries = useMemo<VenueCategory[]>(() => {
    const present = new Set(services.map((s) => primaryIdOf(s.categoryId)).filter(Boolean));
    return categories.filter((c) => c.parentId == null && present.has(c.id));
  }, [categories, services, primaryIdOf]);

  // Selected primary — default to the first, and stay valid across refreshes.
  const effectivePrimaryId =
    primaryId && primaries.some((p) => p.id === primaryId) ? primaryId : (primaries[0]?.id ?? null);

  // Subcategories (leaves with services) of any primary.
  const subcategoriesOf = useCallback(
    (primaryId: string | null): VenueCategory[] => {
      if (!primaryId) return [];
      const seen = new Set<string>();
      const subs: VenueCategory[] = [];
      for (const s of services) {
        if (primaryIdOf(s.categoryId) !== primaryId) continue;
        const leaf = s.categoryId ? catById.get(s.categoryId) : undefined;
        if (leaf && leaf.id !== primaryId && !seen.has(leaf.id)) {
          seen.add(leaf.id);
          subs.push(leaf);
        }
      }
      return subs;
    },
    [services, primaryIdOf, catById],
  );

  const subcategories = useMemo(
    () => subcategoriesOf(effectivePrimaryId),
    [subcategoriesOf, effectivePrimaryId],
  );

  // Service counts (for the category picker sheet).
  const primaryCount = useCallback(
    (primaryId: string) => services.filter((s) => primaryIdOf(s.categoryId) === primaryId).length,
    [services, primaryIdOf],
  );
  const subCount = useCallback(
    (subId: string) => services.filter((s) => s.categoryId === subId).length,
    [services],
  );

  const effectiveSubId = subId && subcategories.some((s) => s.id === subId) ? subId : null;

  const filterActive = filterSubIds.length > 0;

  const filteredServices = useMemo(() => {
    if (filterActive) {
      const set = new Set(filterSubIds);
      return services.filter((s) => s.categoryId && set.has(s.categoryId));
    }
    return services.filter(
      (s) =>
        primaryIdOf(s.categoryId) === effectivePrimaryId &&
        (effectiveSubId ? s.categoryId === effectiveSubId : true),
    );
  }, [services, filterActive, filterSubIds, effectivePrimaryId, effectiveSubId, primaryIdOf]);

  const groupLabel = filterActive
    ? "Filtered"
    : (primaries.find((p) => p.id === effectivePrimaryId)?.name ?? "Services");

  // Selecting a chip clears any active advanced filter (chips resume control).
  const selectPrimary = useCallback((id: string) => {
    setPrimaryId(id);
    setSubId(null);
    setFilterSubIds([]);
  }, []);
  const selectSub = useCallback((id: string | null) => {
    setSubId(id);
    setFilterSubIds([]);
  }, []);

  const applyFilter = useCallback((ids: string[]) => setFilterSubIds(ids), []);
  const clearFilter = useCallback(() => setFilterSubIds([]), []);

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
    primaries,
    primaryIdOf,
    selectedPrimaryId: effectivePrimaryId,
    selectPrimary,
    subcategories,
    subcategoriesOf,
    primaryCount,
    subCount,
    selectedSubId: effectiveSubId,
    selectSub,
    filteredServices,
    groupLabel,
    hasServices: services.length > 0,
    totalServiceCount: services.length,
    filterSubIds,
    filterActive,
    applyFilter,
    clearFilter,
    notify,
    registerNotify,
    refresh,
    retry,
  };
}
