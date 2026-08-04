import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";

// ⚠️ UI-only screen: static mock data on the frontend (no API).
const VENUE = { name: "Lumière Beauty Studio", addressShort: "Babayan 36" };
const TECH_FULL: Record<string, string> = {
  Anushik: "Anushik Movsisyan",
  Davit: "Davit Hakobyan",
  Lilit: "Lilit Sargsyan",
};
const CANCEL_WINDOW = 120;

function money(amount: number): string {
  return `${amount.toLocaleString("en-US")} ֏`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  let total = h * 60 + m + minutes;
  total = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${hh}:${String(mm).padStart(2, "0")}`;
}

export default function BookingConfirmedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    name?: string;
    price?: string;
    duration?: string;
    start?: string;
    dateLabel?: string;
    dateShort?: string;
    tech?: string;
  }>();

  const name = params.name ?? "Face massage";
  const price = params.price ? Number(params.price) : 15000;
  const duration = params.duration ? Number(params.duration) : 45;
  const start = params.start ?? "10:30";
  const dateShort = params.dateShort ?? "4 Aug";
  const dateNoYear = (params.dateLabel ?? "Tue, 4 Aug 2026").replace(/\s\d{4}$/, "");
  const techName = params.tech ?? "Anushik";
  const techFull = TECH_FULL[techName] ?? techName;

  const end = addMinutes(start, duration);
  const cancelBy = addMinutes(start, -CANCEL_WINDOW);
  const whenLabel = `${dateNoYear} · ${start}–${end}`;

  return (
    <View style={styles.container}>
      {/* Hero */}
      <LinearGradient
        colors={["#FF6B6B", "#FF8A73", "#FFA98C"]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 40 }]}
      >
        {/* Confetti */}
        <View style={[styles.confetti, { top: 70, left: 40, transform: [{ rotate: "20deg" }] }]} />
        <View style={[styles.confettiDot, { top: 150, right: 60 }]} />
        <View style={[styles.confetti, { top: 190, right: 40, transform: [{ rotate: "-15deg" }] }]} />
        <View style={[styles.confettiDot, { top: 300, left: 60 }]} />

        <View style={styles.ring}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={40} color={Colors.primary} />
          </View>
        </View>

        <Text style={styles.heroTitle}>You&apos;re booked!</Text>
        <Text style={styles.heroSub}>
          {techName} is expecting you. We&apos;ll remind you two hours before.
        </Text>

        <View style={styles.pendingPill}>
          <View style={styles.pendingDot} />
          <Text style={styles.pendingText}>Pending provider confirmation</Text>
        </View>
      </LinearGradient>

      {/* Sheet */}
      <ScrollView
        style={styles.sheet}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sheetContent}
      >
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.serviceName}>{name}</Text>
            <Text style={styles.servicePrice}>{money(price)}</Text>
          </View>
          <View style={styles.divider} />
          <DetailRow label="When" value={whenLabel} />
          <DetailRow label="Technician" value={techFull} />
          <DetailRow label="Where" value={`${VENUE.name}, ${VENUE.addressShort}`} />
        </View>

        <Text style={styles.payNote}>
          Pay {money(price)} at the venue. Free cancellation until {cancelBy} on {dateShort}.
        </Text>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.replace("/(tabs)/bookings")}
          accessibilityRole="button"
          accessibilityLabel="View my bookings"
        >
          <LinearGradient
            colors={PrimaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryText}>View my bookings</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  hero: {
    height: 468,
    paddingHorizontal: 28,
    alignItems: "center",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  confetti: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,.35)",
  },
  confettiDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,.4)",
  },
  ring: {
    width: 132,
    height: 132,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 34, fontWeight: "800", letterSpacing: -0.6, color: Colors.white },
  heroSub: {
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(255,255,255,.92)",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 8,
  },
  pendingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,.9)",
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 40,
    marginTop: 22,
  },
  pendingDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: Colors.star },
  pendingText: { fontSize: 14, fontWeight: "700", color: "#B4783F" },

  sheet: { flex: 1, marginTop: -20 },
  sheetContent: { paddingHorizontal: 24, paddingTop: 24 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  serviceName: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  servicePrice: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: "#F1F1F4", marginVertical: 14 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 6,
  },
  detailLabel: { fontSize: 15, color: Colors.textSecondary },
  detailValue: { flex: 1, fontSize: 15, fontWeight: "700", color: Colors.textPrimary, textAlign: "right" },
  payNote: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textLight,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 12,
  },

  actions: { paddingHorizontal: 24, paddingTop: 8, gap: 6 },
  primaryButton: { height: 56, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  primaryText: { fontSize: 17, fontWeight: "700", color: Colors.white },
  secondaryButton: { height: 48, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 16, fontWeight: "700", color: Colors.textSecondary },
});
