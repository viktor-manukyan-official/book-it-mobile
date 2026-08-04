import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { useBookings } from "../../src/hooks/useBookings";
import type { Appointment, AppointmentStatus } from "../../src/types/appointment";

type Tab = "upcoming" | "past";

function initial(name: string): string {
  return (name.trim()[0] ?? "?").toUpperCase();
}

function money(amount: number): string {
  return `${amount.toLocaleString("en-US")} ֏`;
}

// Formats an ISO time as e.g. "Tue, 4 Aug · 10:30".
function formatWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

const STATUS_STYLE: Record<AppointmentStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: "rgba(245,158,11,.14)", fg: "#B4790B", label: "Pending" },
  confirmed: { bg: "rgba(59,130,246,.14)", fg: "#2563EB", label: "Confirmed" },
  completed: { bg: "rgba(34,197,94,.14)", fg: "#15803D", label: "Completed" },
  cancelled: { bg: "rgba(239,68,68,.12)", fg: "#DC2626", label: "Cancelled" },
  no_show: { bg: "#F0F0F3", fg: "#9CA3AF", label: "No-show" },
};

// Muted avatar tints cycled by index for the service glyph.
const TINTS = [
  { bg: "#FFE0CC", fg: "#C2554F" },
  { bg: "#E7DEFF", fg: "#7A63B8" },
  { bg: "#D3EAD9", fg: "#3F8A5C" },
  { bg: "#D6E4FB", fg: "#3F5FB4" },
];

function BookingCard({
  appt,
  index,
  isPast,
}: {
  appt: Appointment;
  index: number;
  isPast: boolean;
}) {
  const status = STATUS_STYLE[appt.status];
  const tint = isPast ? { bg: "#F0F0F3", fg: "#9CA3AF" } : TINTS[index % TINTS.length];
  const tech = `${appt.technician.firstName} ${appt.technician.lastName}`.trim();

  return (
    <View style={[styles.card, isPast && styles.cardPast]}>
      <View style={styles.cardHead}>
        <View style={styles.cardHeadLeft}>
          <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
            <Text style={[styles.avatarText, { color: tint.fg }]}>
              {initial(appt.service.name)}
            </Text>
          </View>
          <View style={styles.cardHeadText}>
            <Text style={styles.serviceName} numberOfLines={1}>
              {appt.service.name}
            </Text>
            {tech ? (
              <Text style={styles.tech} numberOfLines={1}>
                {tech}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.fg }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFoot}>
        <View style={styles.whenBlock}>
          <Text style={styles.whenText}>{formatWhen(appt.startTime)}</Text>
          <Text style={styles.venueText} numberOfLines={1}>
            {appt.location.name}
          </Text>
        </View>
        <Text style={styles.price}>{money(appt.price)}</Text>
      </View>
    </View>
  );
}

function EmptyState({ tab, onBrowse }: { tab: Tab; onBrowse: () => void }) {
  const upcoming = tab === "upcoming";
  return (
    <View style={styles.empty}>
      <View style={styles.emptyGlyph}>
        <Text style={styles.emptyGlyphText}>{upcoming ? "🗓️" : "🕓"}</Text>
      </View>
      <View style={styles.emptyTextBlock}>
        <Text style={styles.emptyTitle}>
          {upcoming ? "No upcoming bookings" : "No past visits yet"}
        </Text>
        <Text style={styles.emptyBody}>
          {upcoming
            ? "Find a venue and book your next appointment in a couple of taps."
            : "Once you've been in, your history lands here — with one-tap rebooking."}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={onBrowse}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Browse services"
      >
        <Text style={styles.browseText}>Browse services</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BookingsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("upcoming");
  const { upcoming, past, loading, refreshing, error, refresh, retry } = useBookings();

  const list = tab === "upcoming" ? upcoming : past;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>My bookings</Text>
        <View style={styles.segment}>
          {(["upcoming", "past"] as Tab[]).map((t) => {
            const on = tab === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.segmentItem, on && styles.segmentItemActive]}
                onPress={() => setTab(t)}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.segmentText, on && styles.segmentTextActive]}>
                  {t === "upcoming" ? "Upcoming" : "Past"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.emptyBody}>{error}</Text>
          <TouchableOpacity style={styles.browseButton} onPress={retry}>
            <Text style={styles.browseText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={list.length === 0 ? styles.listEmpty : styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.primary}
            />
          }
        >
          {list.length === 0 ? (
            <EmptyState tab={tab} onBrowse={() => router.push("/")} />
          ) : (
            list.map((a, i) => (
              <BookingCard key={a.id} appt={a} index={i} isPast={tab === "past"} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBlock: { paddingHorizontal: 20, paddingTop: 8, gap: 18 },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5, color: Colors.textPrimary },
  segment: {
    backgroundColor: "#EBEBEF",
    borderRadius: 999,
    padding: 4,
    flexDirection: "row",
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  segmentItemActive: {
    backgroundColor: Colors.white,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: { fontSize: 15, fontWeight: "500", color: "#8B8B95" },
  segmentTextActive: { color: Colors.textPrimary, fontWeight: "600" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  list: { padding: 20, gap: 12 },
  listEmpty: { flexGrow: 1 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardPast: { opacity: 0.78 },
  cardHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  cardHeadLeft: { flexDirection: "row", gap: 12, flex: 1, minWidth: 0 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700" },
  cardHeadText: { flex: 1, minWidth: 0, gap: 3 },
  serviceName: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  tech: { fontSize: 13, color: Colors.textSecondary },
  badge: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#F0F0F3" },
  cardFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  whenBlock: { gap: 2, flex: 1, minWidth: 0 },
  whenText: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  venueText: { fontSize: 12, color: Colors.textLight },
  price: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 18, paddingHorizontal: 46, paddingBottom: 40 },
  emptyGlyph: {
    width: 104,
    height: 104,
    borderRadius: 34,
    backgroundColor: "#FFECE2",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyGlyphText: { fontSize: 40 },
  emptyTextBlock: { gap: 8, alignItems: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "600", letterSpacing: -0.2, color: Colors.textPrimary },
  emptyBody: { fontSize: 15, lineHeight: 22, color: Colors.textSecondary, textAlign: "center" },
  browseButton: {
    height: 50,
    borderRadius: 999,
    paddingHorizontal: 26,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  browseText: { fontSize: 16, fontWeight: "600", color: Colors.white },
});
