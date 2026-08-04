import { useCallback, useEffect, useState } from "react";

import { fetchVenue } from "../services/catalogApi";
import type { VenueDetail } from "../types/catalog";

interface VenueState {
  venue: VenueDetail | null;
  loading: boolean;
  error: string | null;
}

/** Loads a single venue's full profile (company + services + team) by id. */
export function useVenue(id: string | undefined) {
  const [state, setState] = useState<VenueState>({
    venue: null,
    loading: true,
    error: null,
  });
  // Bumped by retry() to re-run the effect.
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (!id) throw new Error("Venue not found.");
        const venue = await fetchVenue(id);
        if (active) setState({ venue, loading: false, error: null });
      } catch (err) {
        if (active) {
          setState({
            venue: null,
            loading: false,
            error: err instanceof Error ? err.message : "Something went wrong.",
          });
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [id, nonce]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setNonce((n) => n + 1);
  }, []);

  return { ...state, retry };
}
