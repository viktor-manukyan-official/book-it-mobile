import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchAvailabilityCalendar,
  fetchBookingSlots,
  fetchServiceTechnicians,
} from "../services/bookingApi";
import type {
  AvailableSlot,
  BookingTechnician,
  DayAvailability,
  GenderPref,
} from "../types/catalog";

const HORIZON_DAYS = 60;

// YYYY-MM-DD for `now` in the given timezone.
function todayInTz(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA gives YYYY-MM-DD
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

interface Params {
  serviceId: string;
  locationId: string;
  timezone: string;
  technicianSelectable: boolean;
  ready: boolean; // serviceDetail loaded
  initialTechnicianId?: string | null; // "Book again" preselect
}

export function useBookingAvailability({
  serviceId,
  locationId,
  timezone,
  technicianSelectable,
  ready,
  initialTechnicianId = null,
}: Params) {
  const [gender, setGenderState] = useState<GenderPref>("any");
  const [technicianId, setTechnicianId] = useState<string | null>(initialTechnicianId);
  const validatedPreselect = useRef(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  const [technicians, setTechnicians] = useState<BookingTechnician[]>([]);
  const [calendar, setCalendar] = useState<DayAvailability[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staleMessage, setStaleMessage] = useState<string | null>(null);

  const calReq = useRef(0);
  const slotReq = useRef(0);

  // Load technicians + calendar (on ready, and whenever gender changes).
  const loadFrame = useCallback(async () => {
    const id = ++calReq.current;
    setCalendarLoading(true);
    setError(null);
    try {
      const from = todayInTz(timezone);
      const to = addDays(from, HORIZON_DAYS);
      const [techs, cal] = await Promise.all([
        technicianSelectable
          ? fetchServiceTechnicians(serviceId, locationId, gender)
          : Promise.resolve<BookingTechnician[]>([]),
        fetchAvailabilityCalendar(serviceId, locationId, from, to, gender, technicianId),
      ]);
      if (id !== calReq.current) return;
      setTechnicians(techs);
      setCalendar(cal);
      // Default date = earliest with availability, else earliest open, else first.
      setSelectedDate((cur) => {
        if (cur && cal.some((d) => d.date === cur)) return cur;
        const avail = cal.find((d) => d.hasAvailability === true);
        const open = cal.find((d) => d.status === "open");
        return avail?.date ?? open?.date ?? cal[0]?.date ?? from;
      });
      setCalendarLoading(false);
    } catch (err) {
      if (id !== calReq.current) return;
      setError(err instanceof Error ? err.message : "Could not load availability.");
      setCalendarLoading(false);
    }
  }, [serviceId, locationId, timezone, technicianSelectable, gender, technicianId]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(loadFrame, 0);
    return () => clearTimeout(t);
  }, [ready, loadFrame]);

  // A "Book again" preselected technician that no longer performs the service
  // falls back to Any once the technician list is known.
  useEffect(() => {
    if (validatedPreselect.current || technicians.length === 0) return;
    validatedPreselect.current = true;
    if (technicianId && !technicians.some((t) => t.id === technicianId)) {
      const t = setTimeout(() => setTechnicianId(null), 0);
      return () => clearTimeout(t);
    }
  }, [technicians, technicianId]);

  // Load slots for the selected date.
  const loadSlots = useCallback(async () => {
    if (!selectedDate) return;
    const id = ++slotReq.current;
    setSlotsLoading(true);
    try {
      const res = await fetchBookingSlots(serviceId, locationId, selectedDate, gender, technicianId);
      if (id !== slotReq.current) return;
      setSlots(res.slots);
      // Drop a selection no longer present.
      setSelectedSlot((cur) =>
        cur && res.slots.some((s) => s.startTime === cur.startTime && s.technicianId === cur.technicianId)
          ? cur
          : null,
      );
      setSlotsLoading(false);
    } catch {
      if (id !== slotReq.current) return;
      setSlots([]);
      setSlotsLoading(false);
    }
  }, [serviceId, locationId, selectedDate, gender, technicianId]);

  useEffect(() => {
    if (!ready || !selectedDate) return;
    const t = setTimeout(loadSlots, 0);
    return () => clearTimeout(t);
  }, [ready, selectedDate, loadSlots]);

  const setGender = useCallback((g: GenderPref) => {
    setGenderState(g);
    setTechnicianId(null);
    setSelectedSlot(null);
  }, []);

  const selectTechnician = useCallback((id: string | null) => {
    setTechnicianId(id);
    setSelectedSlot(null);
  }, []);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  }, []);

  // Re-fetch on focus; if the chosen slot vanished, clear it with a message.
  const refresh = useCallback(async () => {
    const prev = selectedSlot;
    await loadSlots();
    if (prev) {
      // loadSlots already dropped a missing selection; surface a message if so.
      setSlots((s) => {
        const stillThere = s.some(
          (x) => x.startTime === prev.startTime && x.technicianId === prev.technicianId,
        );
        if (!stillThere) setStaleMessage("That time was just taken. Please pick another.");
        return s;
      });
    }
  }, [loadSlots, selectedSlot]);

  const nextAvailableDate = calendar.find(
    (d) => d.date > (selectedDate ?? "") && d.hasAvailability === true,
  )?.date;

  return {
    gender,
    setGender,
    technicians,
    technicianId,
    selectTechnician,
    calendar,
    selectedDate,
    selectDate,
    slots,
    selectedSlot,
    setSelectedSlot,
    calendarLoading,
    slotsLoading,
    error,
    retry: loadFrame,
    refresh,
    staleMessage,
    clearStaleMessage: () => setStaleMessage(null),
    nextAvailableDate,
  };
}
