import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";
import { useBookingAvailability } from "../../src/hooks/useBookingAvailability";
import { useServiceDetail } from "../../src/hooks/useServiceDetail";
import { notifyWhenBookingOpens } from "../../src/services/catalogApi";
import type { AvailableSlot, GenderPref } from "../../src/types/catalog";

const WEEKDAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const money = (n: number) => `${n.toLocaleString("en-US")} ֏`;
const firstName = (full: string) => full.split(" ")[0];

function dateParts(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  return { dow: d.getUTCDay(), day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() };
}

function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function hourInTz(iso: string, tz: string): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(
      new Date(iso),
    ),
  );
}

// Per-technician avatar tints, cycled by index (consistent with the other screens).
const TECH_TINTS: { bg: string; fg: string }[] = [
  { bg: "#F7D3C9", fg: "#C2554F" },
  { bg: "#D3DEF7", fg: "#3F5FB4" },
  { bg: "#E9D9F7", fg: "#7E4FC2" },
  { bg: "#D3EAD9", fg: "#3F8A5C" },
  { bg: "#F3D08A", fg: "#8A6410" },
];

const GENDERS: { key: GenderPref; label: string }[] = [
  { key: "any", label: "Any" },
  { key: "female", label: "Female" },
  { key: "male", label: "Male" },
];

export default function ChooseTimeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    serviceId?: string;
    name?: string;
    duration?: string;
    price?: string;
    mode?: string;
    technicianId?: string; // "Book again" preselect
  }>();
  const serviceId = params.serviceId ?? "";
  const reschedule = params.mode === "reschedule";

  const { service, loading: serviceLoading } = useServiceDetail(serviceId);

  const ready = !!service;
  const {
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
    retry,
    refresh,
    staleMessage,
    clearStaleMessage,
    nextAvailableDate,
  } = useBookingAvailability({
    serviceId,
    locationId: service?.locationId ?? "",
    timezone: service?.timezone ?? "UTC",
    technicianSelectable: service?.customerCanSelectTechnician ?? false,
    ready,
    initialTechnicianId: params.technicianId ?? null,
  });

  const tz = service?.timezone ?? "UTC";
  const name = service?.name ?? params.name ?? "";
  const duration = service?.duration ?? (params.duration ? Number(params.duration) : 0);
  const price = service?.price ?? (params.price ? Number(params.price) : 0);

  // Re-fetch availability when the screen regains focus.
  useFocusEffect(
    useCallback(() => {
      if (ready) void refresh();
    }, [ready, refresh]),
  );

  // Technicians that have at least one slot on the selected date (for chip disabling).
  const techsWithSlots = useMemo(() => new Set(slots.map((s) => s.technicianId)), [slots]);

  // Group slots by time of day. Collapse duplicate start times to a single pill
  // (when "Any" is selected, multiple technicians can offer the same time) — the
  // first slot for that time is kept, and its technician is the one auto-assigned
  // at booking. Slots arrive sorted by start time, so "first" is deterministic.
  const groups = useMemo(() => {
    const g: { key: string; label: string; items: AvailableSlot[] }[] = [
      { key: "morning", label: "MORNING", items: [] },
      { key: "afternoon", label: "AFTERNOON", items: [] },
      { key: "evening", label: "EVENING", items: [] },
    ];
    const seen = new Set<string>();
    for (const s of slots) {
      if (seen.has(s.startTime)) continue; // one pill per start time
      seen.add(s.startTime);
      const h = hourInTz(s.startTime, tz);
      if (h < 12) g[0].items.push(s);
      else if (h < 17) g[1].items.push(s);
      else g[2].items.push(s);
    }
    return g.filter((x) => x.items.length > 0);
  }, [slots, tz]);

  const onReview = () => {
    if (!selectedSlot || !service) return;
    router.push({
      pathname: "/booking/review",
      params: {
        serviceId: service.id,
        name,
        price: String(price),
        date: selectedDate ?? "",
        start: selectedSlot.startTime,
        end: selectedSlot.endTime,
        technicianId: selectedSlot.technicianId,
        technicianName: selectedSlot.technicianName,
      },
    });
  };

  const onNotify = () => {
    if (service) void notifyWhenBookingOpens(service.venueId);
  };

  const horizonDays = calendar.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Choose a time</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {name}
            {duration ? ` · ${duration} min` : ""}
          </Text>
        </View>
      </View>

      {error && !calendarLoading ? (
        <View style={styles.centered}>
          <Text style={styles.dimText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={retry}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Date strip */}
          <View style={styles.dateHeader}>
            <Text style={styles.monthLabel}>
              {selectedDate
                ? `${MONTHS_FULL[dateParts(selectedDate).month]} ${dateParts(selectedDate).year}`
                : ""}
            </Text>
            {horizonDays > 0 ? (
              <Text style={styles.horizonNote}>Booking up to {horizonDays} days out</Text>
            ) : null}
          </View>

          {serviceLoading || calendarLoading ? (
            <View style={styles.dateStrip}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.dateCell, styles.skel]} />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateStrip}
            >
              {calendar.map((d) => {
                const { dow, day } = dateParts(d.date);
                const selected = d.date === selectedDate;
                const disabled = d.status !== "open";
                const cell = (
                  <View
                    style={[
                      styles.dateCell,
                      selected && styles.dateCellSelected,
                      disabled && styles.dateCellDisabled,
                    ]}
                  >
                    <Text style={[styles.dateDow, selected && styles.dateTextSelected]}>
                      {WEEKDAY_ABBR[dow]}
                    </Text>
                    <Text
                      style={[
                        styles.dateNum,
                        selected && styles.dateTextSelected,
                        disabled && styles.dateNumStruck,
                      ]}
                    >
                      {day}
                    </Text>
                    {d.hasAvailability === true && !selected ? (
                      <View style={styles.availDot} />
                    ) : (
                      <View style={styles.availDotPlaceholder} />
                    )}
                  </View>
                );
                return disabled ? (
                  <View key={d.date}>{cell}</View>
                ) : (
                  <TouchableOpacity
                    key={d.date}
                    onPress={() => selectDate(d.date)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    {selected ? (
                      <LinearGradient
                        colors={PrimaryGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.dateCell}
                      >
                        <Text style={[styles.dateDow, styles.dateTextSelected]}>
                          {WEEKDAY_ABBR[dow]}
                        </Text>
                        <Text style={[styles.dateNum, styles.dateTextSelected]}>{day}</Text>
                        <View style={styles.availDotPlaceholder} />
                      </LinearGradient>
                    ) : (
                      cell
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.legend}>
            <View style={styles.availDot} />
            <Text style={styles.legendText}>slots open</Text>
            <View style={styles.legendDotMuted} />
            <Text style={styles.legendText}>closed · holiday</Text>
          </View>

          {/* Gender + Technician (only when selectable) */}
          {service?.customerCanSelectTechnician ? (
            <>
              <Text style={styles.sectionLabel}>Provider preference</Text>
              <View style={styles.segmented}>
                {GENDERS.map((g) => {
                  const on = gender === g.key;
                  return (
                    <TouchableOpacity
                      key={g.key}
                      style={[styles.segment, on && styles.segmentOn]}
                      onPress={() => setGender(g.key)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={on ? styles.segmentTextOn : styles.segmentText}>{g.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.techHeader}>
                <Text style={styles.sectionLabel}>Technician</Text>
                <Text style={styles.techCount}>{technicians.length} available</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.techRow}
              >
                <TechChip
                  label="Any"
                  any
                  selected={technicianId === null}
                  disabled={false}
                  onPress={() => selectTechnician(null)}
                />
                {technicians.map((t, i) => {
                  const disabled = technicianId === null && !techsWithSlots.has(t.id);
                  return (
                    <TechChip
                      key={t.id}
                      label={t.firstName}
                      initials={t.initials}
                      tint={TECH_TINTS[i % TECH_TINTS.length]}
                      selected={technicianId === t.id}
                      disabled={disabled}
                      onPress={() => selectTechnician(t.id)}
                    />
                  );
                })}
              </ScrollView>
            </>
          ) : null}

          {/* Stale banner */}
          {staleMessage ? (
            <TouchableOpacity style={styles.staleBanner} onPress={clearStaleMessage}>
              <Text style={styles.staleText}>{staleMessage}</Text>
            </TouchableOpacity>
          ) : null}

          {/* Slots */}
          {slotsLoading ? (
            <View style={styles.slotArea}>
              <View style={[styles.skelLine, { width: "30%", marginBottom: 12 }]} />
              <View style={styles.slotWrap}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.slotPill, styles.skel]} />
                ))}
              </View>
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIllustration}>🗓️</Text>
              <Text style={styles.emptyHeading}>
                No availability on {selectedDate ? `${WEEKDAY_ABBR[dateParts(selectedDate).dow]} ${dateParts(selectedDate).day}` : "this day"}
              </Text>
              <Text style={styles.dimText}>
                Every slot is taken or the service doesn&apos;t fit the remaining time. Try another
                day.
              </Text>
              {nextAvailableDate ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => selectDate(nextAvailableDate)}
                >
                  <Text style={styles.primaryButtonText}>
                    Jump to {WEEKDAY_ABBR[dateParts(nextAvailableDate).dow]}{" "}
                    {dateParts(nextAvailableDate).day}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.secondaryButton} onPress={onNotify}>
                <Text style={styles.secondaryButtonText}>Notify me</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.slotArea}>
              {groups.map((g) => (
                <View key={g.key} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupLabel}>{g.label}</Text>
                    <View style={styles.groupDivider} />
                  </View>
                  <View style={styles.slotWrap}>
                    {g.items.map((s) => {
                      const on = selectedSlot?.startTime === s.startTime;
                      // Pills show the time only; the technician (for "Any", the
                      // first available at this time) is resolved at booking.
                      const pillInner = (
                        <Text style={[styles.slotTime, on && styles.slotTextOn]}>
                          {fmtTime(s.startTime, tz)}
                        </Text>
                      );
                      return (
                        <TouchableOpacity
                          key={`${s.startTime}-${s.technicianId}`}
                          onPress={() => setSelectedSlot(s)}
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                        >
                          {on ? (
                            <LinearGradient
                              colors={PrimaryGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.slotPill}
                            >
                              {pillInner}
                            </LinearGradient>
                          ) : (
                            <View style={[styles.slotPill, styles.slotPillIdle]}>{pillInner}</View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Summary + action bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
        {selectedSlot && selectedDate ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText} numberOfLines={1}>
              {WEEKDAY_ABBR[dateParts(selectedDate).dow]} {dateParts(selectedDate).day}{" "}
              {MONTHS[dateParts(selectedDate).month]} · {fmtTime(selectedSlot.startTime, tz)}–
              {fmtTime(selectedSlot.endTime, tz)} · {firstName(selectedSlot.technicianName)}
            </Text>
            <Text style={styles.summaryPrice}>{money(price)}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onReview}
          disabled={!selectedSlot}
          accessibilityRole="button"
          accessibilityLabel={reschedule ? "Confirm new time" : "Review booking"}
        >
          <LinearGradient
            colors={selectedSlot ? PrimaryGradient : [Colors.border, Colors.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            {slotsLoading && !selectedSlot ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={[styles.ctaText, !selectedSlot && styles.ctaTextDisabled]}>
                {reschedule ? "Confirm new time" : "Review booking"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TechChip({
  label,
  initials,
  tint,
  any,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  initials?: string;
  tint?: { bg: string; fg: string };
  any?: boolean;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[
        styles.techChip,
        selected ? styles.techChipSelected : styles.chipInactive,
        disabled && styles.chipDisabled,
      ]}
    >
      <View
        style={[
          styles.techAvatar,
          any
            ? styles.techAvatarAny
            : { backgroundColor: tint?.bg ?? Colors.background },
        ]}
      >
        {any ? (
          <Ionicons name="sparkles" size={14} color={selected ? Colors.white : Colors.primary} />
        ) : (
          <Text style={[styles.techAvatarText, { color: tint?.fg ?? Colors.textSecondary }]}>
            {initials}
          </Text>
        )}
      </View>
      <Text
        style={[
          selected ? styles.chipTextActive : styles.chipTextInactive,
          disabled && styles.chipTextDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.4, color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary },

  dateHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  monthLabel: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  horizonNote: { fontSize: 13, color: Colors.textLight },
  dateStrip: { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  dateCell: {
    width: 60,
    height: 78,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dateCellSelected: { borderWidth: 0 },
  dateCellDisabled: { backgroundColor: Colors.background, borderColor: "transparent" },
  dateDow: { fontSize: 11, fontWeight: "600", color: Colors.textLight },
  dateNum: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  dateNumStruck: { textDecorationLine: "line-through", color: Colors.textLight },
  dateTextSelected: { color: Colors.white },
  availDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: Colors.success },
  availDotPlaceholder: { width: 5, height: 5 },

  legend: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, marginTop: -2 },
  legendText: { fontSize: 12, color: Colors.textLight, marginRight: 6 },
  legendDotMuted: { width: 5, height: 5, borderRadius: 999, backgroundColor: Colors.textLight },

  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  segmented: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#EBEAEE",
    borderRadius: 999,
    padding: 4,
  },
  segment: { flex: 1, minHeight: 44, borderRadius: 999, justifyContent: "center", alignItems: "center" },
  segmentOn: {
    backgroundColor: Colors.card,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
  segmentTextOn: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  techHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  techCount: { fontSize: 13, color: Colors.textLight, paddingRight: 20 },
  techRow: { paddingHorizontal: 20, gap: 8 },
  techChip: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingRight: 16,
  },
  techChipSelected: { backgroundColor: Colors.textPrimary },
  techAvatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  techAvatarAny: { backgroundColor: "rgba(255,255,255,.15)" },
  techAvatarText: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },

  chipActive: { backgroundColor: Colors.textPrimary },
  chipInactive: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipDisabled: { opacity: 0.45 },
  chipTextActive: { fontSize: 14, fontWeight: "600", color: Colors.white },
  chipTextInactive: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  chipTextDisabled: { color: Colors.textLight },

  staleBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
  },
  staleText: { fontSize: 13, color: "#92400E", fontWeight: "500" },

  slotArea: { paddingHorizontal: 20, paddingTop: 18 },
  group: { marginBottom: 20 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  groupLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.6, color: Colors.textLight },
  groupDivider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  slotWrap: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  slotPill: {
    minWidth: 92,
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  slotPillIdle: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  slotTime: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  slotTextOn: { color: Colors.white },

  emptyState: { padding: 32, alignItems: "center", gap: 12 },
  emptyIllustration: { fontSize: 44 },
  emptyHeading: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary, textAlign: "center" },

  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 14 },
  dimText: { fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  primaryButton: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { fontSize: 15, fontWeight: "600", color: Colors.white },
  secondaryButton: { minHeight: 44, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  secondaryButtonText: { fontSize: 15, fontWeight: "600", color: Colors.primary },

  actionBar: {
    backgroundColor: Colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  summaryText: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  summaryPrice: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  cta: { height: 54, borderRadius: 999, justifyContent: "center", alignItems: "center" },
  ctaText: { fontSize: 16, fontWeight: "700", color: Colors.white },
  ctaTextDisabled: { color: Colors.textLight },

  skel: { backgroundColor: "#ECECEF" },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: "#ECECEF" },
});
