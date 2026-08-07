import { useCallback, useEffect, useRef, useState } from "react";

import { fetchServiceDetail } from "../services/catalogApi";
import type { ServiceDetail } from "../types/catalog";

interface State {
  service: ServiceDetail | null;
  loading: boolean;
  error: string | null;
  notFound: boolean; // service removed/deactivated → full not-found state
}

/** Loads one service's public details (BOOK-71). */
export function useServiceDetail(id: string | undefined) {
  const [state, setState] = useState<State>({
    service: null,
    loading: true,
    error: null,
    notFound: false,
  });
  const requestId = useRef(0);

  const run = useCallback(() => {
    if (!id) return;
    const rid = ++requestId.current;
    void fetchServiceDetail(id)
      .then((service) => {
        if (rid !== requestId.current) return;
        setState({ service, loading: false, error: null, notFound: false });
      })
      .catch((err: unknown) => {
        if (rid !== requestId.current) return;
        const message = err instanceof Error ? err.message : "Something went wrong.";
        const notFound = /not found/i.test(message);
        setState({ service: null, loading: false, error: notFound ? null : message, notFound });
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const t = setTimeout(run, 0);
    return () => clearTimeout(t);
  }, [id, run]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null, notFound: false }));
    run();
  }, [run]);

  return { ...state, retry };
}
