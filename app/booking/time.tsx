import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";

// ⚠️ UI-only screen: static mock data on the frontend (no API).

type DayStatus = "open" | "closed";

interface Day {
  weekday: string;
  date: number;
  status: DayStatus;
  holiday?: boolean;
}

const MONTH_LABEL = "August 2026";
const MONTH_SHORT = "Aug";

const DAYS: Day[] = [
  { weekday: "SUN", date: 2, status: "closed" },
  { weekday: "MON", date: 3, status: "open" },
  { weekday: "TUE", date: 4, status: "open", holiday: true },
  { weekday: "WED", date: 5, status: "open" },
  { weekday: "THU", date: 6, status: "closed" },
  { weekday: "FRI", date: 7, status: "open" },
  { weekday: "SAT", date: 8, status: "open" },
  { weekday: "SUN", date: 9, status: "closed" },
  { weekday: "MON", date: 10, status: "open" },
];

interface Tech {
  id: string;
  name: string;
  initials: string;
  bg: string;
  fg: string;
}

const TECHS: Tech[] = [
  { id: "anushik", name: "Anushik", initials: "AM", bg: "#F7D3C9", fg: "#C2554F" },
  { id: "davit", name: "Davit", initials: "DH", bg: "#D3DEF7", fg: "#3F5FB4" },
  { id: "lilit", name: "Lilit", initials: "LS", bg: "#E9D9F7", fg: "#7E4FC2" },
];

type Period = "morning" | "afternoon" | "evening";

interface Slot {
  time: string;
  tech: string; // tech name
  period: Period;
}

const SLOTS: Slot[] = [
  { time: "9:30", tech: "Anushik", period: "morning" },
  { time: "10:15", tech: "Davit", period: "morning" },
  { time: "10:30", tech: "Anushik", period: "morning" },
  { time: "11:00", tech: "Lilit", period: "morning" },
  { time: "11:45", tech: "Anushik", period: "morning" },
  { time: "13:00", tech: "Davit", period: "afternoon" },
  { time: "14:30", tech: "Lilit", period: "afternoon" },
  { time: "15:15", tech: "Anushik", period: "afternoon" },
  { time: "16:00", tech: "Davit", period: "afternoon" },
  { time: "18:00", tech: "Lilit", period: "evening" },
  { time: "18:45", tech: "Anushik", period: "evening" },
];

const PERIOD_LABEL: Record<Period, string> = {
  morning: "MORNING",
  afternoon: "AFTERNOON",
  evening: "EVENING",
};

function money(amount: number): string {
  return `${amount.toLocaleString("en-US")} ֏`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${hh}:${String(mm).padStart(2, "0")}`;
}

export default function ChooseTimeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; duration?: string; price?: string }>();
  const serviceName = params.name ?? "Face massage";
  const duration = params.duration ? Number(params.duration) : 45;
  const price = params.price ? Number(params.price) : 15000;

  const [selectedDate, setSelectedDate] = useState<number>(4);
  const [tech, setTech] = useState<string>("any"); // "any" | tech.name
  const [slotKey, setSlotKey] = useState<string>("10:30|Anushik");

  const visibleSlots = useMemo(
    () => (tech === "any" ? SLOTS : SLOTS.filter((s) => s.tech === tech)),
    [tech],
  );

  const grouped = useMemo(() => {
    const g: Record<Period, Slot[]> = { morning: [], afternoon: [], evening: [] };
    for (const s of visibleSlots) g[s.period].push(s);
    return g;
  }, [visibleSlots]);

  const selectedSlot = useMemo(
    () => visibleSlots.find((s) => `${s.time}|${s.tech}` === slotKey) ?? null,
    [visibleSlots, slotKey],
  );

  const selectedDay = DAYS.find((d) => d.date === selectedDate);
  const summary = selectedSlot
    ? `${selectedDay?.weekday ? cap(selectedDay.weekday) : ""} ${selectedDate} ${MONTH_SHORT} · ${selectedSlot.time}–${addMinutes(
        selectedSlot.time,
        duration,
      )} · ${selectedSlot.tech}`
    : "Pick a time slot";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Choose a time</Text>
          <Text style={styles.subtitle}>
            {serviceName} · {duration} min
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Month row */}
        <View style={styles.monthRow}>
          <Text style={styles.monthLabel}>{MONTH_LABEL}</Text>
          <Text style={styles.monthHint}>Booking up to 60 days out</Text>
        </View>

        {/* Date strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        >
          {DAYS.map((d) => {
            const on = d.date === selectedDate;
            const closed = d.status === "closed";
            return (
              <TouchableOpacity
                key={d.date}
                disabled={closed}
                onPress={() => setSelectedDate(d.date)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: on, disabled: closed }}
                accessibilityLabel={`${d.weekday} ${d.date}${closed ? ", closed" : ""}`}
                style={[
                  styles.dateCell,
                  closed && styles.dateCellClosed,
                  on && styles.dateCellActive,
                ]}
              >
                <Text style={[styles.dateWeekday, on && styles.dateTextActive, closed && styles.dateTextClosed]}>
                  {d.weekday}
                </Text>
                <Text style={[styles.dateNum, on && styles.dateTextActive, closed && styles.dateTextClosed]}>
                  {d.date}
                </Text>
                {on ? (
                  <View style={styles.dotWhite} />
                ) : d.status === "open" ? (
                  <View style={styles.dotOpen} />
                ) : (
                  <View style={styles.dotHidden} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.dotOpen} />
            <Text style={styles.legendText}>slots open</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dotOpen, { backgroundColor: Colors.textLight }]} />
            <Text style={styles.legendText}>closed · holiday</Text>
          </View>
        </View>

        {/* Technician */}
        <Text style={styles.blockTitle}>Technician</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.techStrip}
        >
          <TouchableOpacity
            onPress={() => setTech("any")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: tech === "any" }}
            style={[styles.techChip, tech === "any" ? styles.techChipActive : styles.techChipInactive]}
          >
            <View style={styles.anyIcon}>
              <Ionicons name="sparkles" size={13} color={Colors.white} />
            </View>
            <Text style={[styles.techName, tech === "any" && styles.techNameActive]}>Any</Text>
          </TouchableOpacity>
          {TECHS.map((t) => {
            const on = tech === t.name;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTech(t.name)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.techChip, on ? styles.techChipActive : styles.techChipInactive]}
              >
                <View style={[styles.techAvatar, { backgroundColor: t.bg }]}>
                  <Text style={[styles.techAvatarText, { color: t.fg }]}>{t.initials}</Text>
                </View>
                <Text style={[styles.techName, on && styles.techNameActive]}>{t.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Slots by period */}
        {(["morning", "afternoon", "evening"] as Period[]).map((p) =>
          grouped[p].length > 0 ? (
            <View key={p} style={styles.periodBlock}>
              <View style={styles.periodHead}>
                <Text style={styles.periodLabel}>{PERIOD_LABEL[p]}</Text>
                <View style={styles.periodLine} />
              </View>
              <View style={styles.slotGrid}>
                {grouped[p].map((s) => {
                  const key = `${s.time}|${s.tech}`;
                  const on = key === slotKey;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setSlotKey(key)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${s.time} with ${s.tech}`}
                      style={[styles.slot, on ? styles.slotActive : styles.slotInactive]}
                    >
                      <Text style={[styles.slotTime, on && styles.slotTimeActive]}>{s.time}</Text>
                      <Text style={[styles.slotTech, on && styles.slotTechActive]}>{s.tech}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null,
        )}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.ctaBar}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText} numberOfLines={1}>
            {summary}
          </Text>
          <Text style={styles.summaryPrice}>{money(price)}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!selectedSlot}
          onPress={() => {
            if (!selectedSlot || !selectedDay) return;
            router.push({
              pathname: "/booking/review",
              params: {
                name: serviceName,
                duration: String(duration),
                price: String(price),
                start: selectedSlot.time,
                tech: selectedSlot.tech,
                dateLabel: `${cap(selectedDay.weekday)}, ${selectedDate} ${MONTH_SHORT} 2026`,
                dateShort: `${selectedDate} ${MONTH_SHORT}`,
              },
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Review booking"
        >
          <LinearGradient
            colors={PrimaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaButton, !selectedSlot && styles.ctaDisabled]}
          >
            <Text style={styles.ctaText}>Review booking</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function cap(weekday: string): string {
  return weekday.charAt(0) + weekday.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 6 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3, color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textLight, marginTop: 2 },

  scroll: { paddingBottom: 150 },

  monthRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  monthLabel: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  monthHint: { fontSize: 13, color: Colors.textLight },

  dateStrip: { paddingHorizontal: 20, paddingTop: 14, gap: 10 },
  dateCell: {
    width: 62,
    height: 84,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  dateCellClosed: { backgroundColor: "#EFEFF2", borderColor: "#EFEFF2" },
  dateCellActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateWeekday: { fontSize: 11, fontWeight: "600", color: Colors.textLight, letterSpacing: 0.5 },
  dateNum: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },
  dateTextActive: { color: Colors.white },
  dateTextClosed: { color: Colors.textLight },
  dotOpen: { width: 6, height: 6, borderRadius: 999, backgroundColor: Colors.success },
  dotWhite: { width: 6, height: 6, borderRadius: 999, backgroundColor: Colors.white },
  dotHidden: { width: 6, height: 6, borderRadius: 999, backgroundColor: "transparent" },

  legend: { flexDirection: "row", gap: 16, paddingHorizontal: 20, paddingTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: { fontSize: 12, color: Colors.textLight },

  blockTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary, paddingHorizontal: 20, paddingTop: 22 },
  techStrip: { paddingHorizontal: 20, paddingTop: 14, gap: 10 },
  techChip: {
    height: 52,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 8,
    paddingRight: 18,
  },
  techChipActive: { backgroundColor: Colors.textPrimary },
  techChipInactive: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  anyIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#3A3A4E",
    alignItems: "center",
    justifyContent: "center",
  },
  techAvatar: { width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  techAvatarText: { fontSize: 12, fontWeight: "700" },
  techName: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  techNameActive: { color: Colors.white },

  periodBlock: { paddingHorizontal: 20, paddingTop: 22 },
  periodHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  periodLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 1, color: Colors.textLight },
  periodLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 14 },
  slot: {
    width: 74,
    height: 62,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  slotInactive: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  slotActive: { backgroundColor: Colors.primary },
  slotTime: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  slotTimeActive: { color: Colors.white },
  slotTech: { fontSize: 11, color: Colors.textLight },
  slotTechActive: { color: "rgba(255,255,255,.85)" },

  ctaBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F1F4",
    gap: 12,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  summaryText: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  summaryPrice: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  ctaButton: { height: 56, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontSize: 17, fontWeight: "700", color: Colors.white },
});
