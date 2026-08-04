import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchMyAppointments } from "../services/appointmentsApi";
import type { Appointment } from "../types/appointment";

interface BookingsState {
  all: Appointment[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

// Statuses that keep an appointment in the "Upcoming" tab (while still in the
// future). Cancelled / completed / no-show always fall to "Past".
const ACTIVE = new Set<Appointment["status"]>(["pending", "confirmed"]);

/**
 * Loads the signed-in customer's bookings and splits them into Upcoming / Past.
 * Upcoming = active status AND start time in the future; everything else is Past.
 */
export function useBookings() {
  const [state, setState] = useState<BookingsState>({
    all: [],
    loading: true,
    refreshing: false,
    error: null,
  });

  const load = useCallback(async (mode: "initial" | "refresh") => {
    setState((s) => ({
      ...s,
      loading: mode === "initial",
      refreshing: mode === "refresh",
      error: null,
    }));
    try {
      const all = await fetchMyAppointments({ limit: 50 });
      setState({ all, loading: false, refreshing: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        refreshing: false,
        error: err instanceof Error ? err.message : "Something went wrong.",
      }));
    }
  }, []);

  useEffect(() => {
    void load("initial");
  }, [load]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: Appointment[] = [];
    const pa: Appointment[] = [];
    for (const a of state.all) {
      const future = new Date(a.startTime).getTime() >= now;
      if (future && ACTIVE.has(a.status)) up.push(a);
      else pa.push(a);
    }
    // Upcoming soonest-first; past most-recent-first.
    up.sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
    pa.sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));
    return { upcoming: up, past: pa };
  }, [state.all]);

  return {
    upcoming,
    past,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    refresh: () => load("refresh"),
    retry: () => load("initial"),
  };
}
