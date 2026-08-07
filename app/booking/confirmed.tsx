import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";
import { fetchMyAppointment } from "../../src/services/bookingApi";
import type { CustomerAppointment } from "../../src/types/catalog";

const money = (n: number) => `${n.toLocaleString("en-US")} ֏`;

function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(iso),
  );
}
function fmtWhen(iso: string, endIso: string, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("weekday")}, ${get("day")} ${get("month")} · ${fmtTime(iso, tz)}–${fmtTime(endIso, tz)}`;
}
function fmtDeadline(startIso: string, freeCancelMinutes: number, tz: string): string {
  const d = new Date(new Date(startIso).getTime() - freeCancelMinutes * 60_000);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: false }).format(d);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "numeric", month: "short" }).format(d);
  return `${time} on ${day}`;
}

export default function BookingConfirmedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ appointmentId?: string }>();

  const [appt, setAppt] = useState<CustomerAppointment | null>(null);
  const [loading, setLoading] = useState(!!params.appointmentId);

  // Read from the created record (deep-link / partial-response safe).
  useEffect(() => {
    if (!params.appointmentId) return;
    let active = true;
    void fetchMyAppointment(params.appointmentId)
      .then((a) => active && setAppt(a))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.appointmentId]);

  const goHome = () => {
    try {
      router.dismissAll();
    } catch {
      /* not in a dismissable stack */
    }
    router.navigate("/(tabs)");
  };
  const goBookings = () => {
    try {
      router.dismissAll();
    } catch {
      /* not in a dismissable stack */
    }
    router.navigate("/(tabs)/bookings");
  };

  const confirmed = appt?.status === "confirmed";
  const techFirst = appt?.technicianName.split(" ")[0] ?? "";
  const where = appt ? [appt.venueName, appt.venueAddress].filter(Boolean).join(", ") : "";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Hero */}
        <LinearGradient
          colors={["#FF7E6B", "#FF9478", "#FFA98A"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 40 }]}
        >
          <View style={styles.confetti1} />
          <View style={styles.confetti2} />
          <View style={styles.checkRing}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={40} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.heroTitle}>You&apos;re booked!</Text>
          <Text style={styles.heroBody}>
            {techFirst ? `${techFirst} is expecting you.` : "Your appointment is set."}
          </Text>
          <View style={styles.pill}>
            <View
              style={[styles.pillDot, { backgroundColor: confirmed ? Colors.success : Colors.star }]}
            />
            <Text style={styles.pillText}>
              {confirmed ? "Confirmed" : "Pending provider confirmation"}
            </Text>
          </View>
        </LinearGradient>

        {/* Details */}
        <View style={styles.bodyWrap}>
          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : appt ? (
            <>
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.serviceName} numberOfLines={1}>
                    {appt.serviceName}
                  </Text>
                  <Text style={styles.price}>{money(appt.price)}</Text>
                </View>
                <View style={styles.divider} />
                <Row label="When" value={fmtWhen(appt.startTime, appt.endTime, appt.timezone)} />
                <Row label="Technician" value={appt.technicianName} />
                <Row label="Where" value={where} />
              </View>
              <Text style={styles.payNote}>
                Pay {money(appt.price)} at the venue. Free cancellation until{" "}
                {fmtDeadline(appt.startTime, appt.freeCancelMinutes, appt.timezone)}.
              </Text>
            </>
          ) : (
            <Text style={styles.payNote}>Your booking is confirmed.</Text>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={goBookings}
          accessibilityRole="button"
          accessibilityLabel="View my bookings"
        >
          <LinearGradient colors={PrimaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
            <Text style={styles.ctaText}>View my bookings</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondary}
          onPress={goHome}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <Text style={styles.secondaryText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
    gap: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  confetti1: {
    position: "absolute",
    top: 90,
    left: 40,
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,.5)",
    transform: [{ rotate: "20deg" }],
  },
  confetti2: {
    position: "absolute",
    top: 150,
    right: 48,
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,.4)",
    transform: [{ rotate: "-15deg" }],
  },
  checkRing: {
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircle: {
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 34, fontWeight: "800", letterSpacing: -0.8, color: Colors.white, marginTop: 6 },
  heroBody: { fontSize: 16, color: "rgba(255,255,255,.92)", textAlign: "center", lineHeight: 23, paddingHorizontal: 20 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,.9)",
    borderRadius: 999,
    paddingHorizontal: 16,
    minHeight: 40,
    marginTop: 6,
  },
  pillDot: { width: 8, height: 8, borderRadius: 999 },
  pillText: { fontSize: 14, fontWeight: "700", color: "#8A5A12" },

  bodyWrap: { padding: 20, gap: 14 },
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
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  serviceName: { flex: 1, fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  price: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  rowLabel: { fontSize: 15, color: Colors.textSecondary },
  rowValue: { flex: 1, fontSize: 15, fontWeight: "700", color: Colors.textPrimary, textAlign: "right" },
  payNote: { fontSize: 14, color: Colors.textLight, textAlign: "center", lineHeight: 21, paddingHorizontal: 8 },

  actions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 6,
    backgroundColor: Colors.background,
  },
  cta: { height: 54, borderRadius: 999, justifyContent: "center", alignItems: "center" },
  ctaText: { fontSize: 16, fontWeight: "700", color: Colors.white },
  secondary: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  secondaryText: { fontSize: 16, fontWeight: "600", color: Colors.textSecondary },
});
