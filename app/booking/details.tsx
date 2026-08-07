import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { fetchMyAppointment, fetchMyReview } from "../../src/services/bookingApi";
import type { CustomerAppointment, Review } from "../../src/types/catalog";

// Minimal read-only Booking details (BOOK-75 entry point). Cancellation and
// rescheduling are a separate task.
const money = (n: number) => `${n.toLocaleString("en-US")} ֏`;
const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#FBE5C8", fg: "#8A5A12", label: "Pending" },
  confirmed: { bg: "#D6E4FB", fg: "#3F5FB4", label: "Confirmed" },
  completed: { bg: "#D3EAD9", fg: "#2E6B4F", label: "Completed" },
  cancelled: { bg: "#FBD9D6", fg: "#B4453F", label: "Cancelled" },
  no_show: { bg: "#ECECEF", fg: "#6B7280", label: "No-show" },
};

function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(iso),
  );
}
function fmtWhen(iso: string, endIso: string, tz: string): string {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("weekday")}, ${g("day")} ${g("month")} ${g("year")} · ${fmtTime(iso, tz)}–${fmtTime(endIso, tz)}`;
}

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appt, setAppt] = useState<CustomerAppointment | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [cancellable, setCancellable] = useState(false);

  // Re-fetch on focus so returning from the cancel / rate sheets reflects the
  // new state (cancelled status, or a just-submitted review).
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      let active = true;
      void fetchMyAppointment(id)
        .then((a) => {
          if (!active) return;
          setAppt(a);
          setCancellable(
            (a.status === "pending" || a.status === "confirmed") &&
              new Date(a.startTime).getTime() > Date.now(),
          );
          if (a.status === "completed") {
            void fetchMyReview(id)
              .then((r) => active && setReview(r))
              .catch(() => {});
          }
        })
        .catch(() => {})
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [id]),
  );

  const canRate = appt?.status === "completed" && !review;

  const status = appt ? (STATUS[appt.status] ?? STATUS.pending) : null;
  const where = appt ? [appt.venueName, appt.venueAddress].filter(Boolean).join(", ") : "";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/bookings"))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Booking details</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : appt ? (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.serviceName} numberOfLines={2}>
                {appt.serviceName}
              </Text>
              {status ? (
                <View style={[styles.badge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.badgeText, { color: status.fg }]}>{status.label}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.divider} />
            <Row label="When" value={fmtWhen(appt.startTime, appt.endTime, appt.timezone)} />
            <Row label="Technician" value={appt.technicianName} />
            <Row label="Where" value={where} />
            <Row label="Price" value={`${money(appt.price)} · pay at venue`} />
          </View>

          {review ? (
            <View style={styles.reviewedRow}>
              <Text style={styles.reviewedLabel}>Your rating</Text>
              <Text style={styles.reviewedStars}>
                {"★".repeat(review.rating)}
                <Text style={styles.reviewedStarsEmpty}>{"★".repeat(5 - review.rating)}</Text>
              </Text>
            </View>
          ) : null}

          {canRate ? (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => router.push({ pathname: "/booking/rate", params: { id: appt.id } })}
              accessibilityRole="button"
              accessibilityLabel="Rate your visit"
            >
              <Text style={styles.rateButtonText}>Rate your visit</Text>
            </TouchableOpacity>
          ) : null}

          {cancellable ? (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.push({ pathname: "/booking/cancel", params: { id: appt.id } })}
              accessibilityRole="button"
              accessibilityLabel="Cancel booking"
            >
              <Text style={styles.cancelButtonText}>Cancel booking</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.dimText}>Booking not found.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.4, color: Colors.textPrimary },
  body: { padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 12 },
  dimText: { fontSize: 15, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  serviceName: { flex: 1, fontSize: 19, fontWeight: "700", color: Colors.textPrimary },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  rowLabel: { fontSize: 15, color: Colors.textSecondary },
  rowValue: { flex: 1, fontSize: 15, fontWeight: "700", color: Colors.textPrimary, textAlign: "right" },
  cancelButton: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: { fontSize: 15, fontWeight: "700", color: Colors.error },
  rateButton: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  rateButtonText: { fontSize: 15, fontWeight: "700", color: Colors.white },
  reviewedRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewedLabel: { fontSize: 15, color: Colors.textSecondary },
  reviewedStars: { fontSize: 18, color: Colors.star, letterSpacing: 2 },
  reviewedStarsEmpty: { color: "#D8D8DE" },
});

