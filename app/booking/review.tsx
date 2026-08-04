import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";

// ⚠️ UI-only screen: static mock data on the frontend (no API).
const VENUE = { name: "Lumière Beauty Studio", address: "Babayan 36, Yerevan" };
const TECH_FULL: Record<string, string> = {
  Anushik: "Anushik Movsisyan",
  Davit: "Davit Hakobyan",
  Lilit: "Lilit Sargsyan",
};
const CANCEL_WINDOW = 120;
const CANCEL_FEE = 3000;

function money(amount: number): string {
  return `${amount.toLocaleString("en-US")} ֏`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  let total = h * 60 + m + minutes;
  total = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${hh}:${String(mm).padStart(2, "0")}`;
}

export default function BookingReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string;
    category?: string;
    price?: string;
    duration?: string;
    start?: string;
    dateLabel?: string;
    dateShort?: string;
    tech?: string;
  }>();

  const name = params.name ?? "Face massage";
  const category = params.category ?? "Face procedures";
  const price = params.price ? Number(params.price) : 15000;
  const duration = params.duration ? Number(params.duration) : 45;
  const start = params.start ?? "10:30";
  const dateLabel = params.dateLabel ?? "Tue, 4 Aug 2026";
  const dateShort = params.dateShort ?? "4 Aug";
  const techName = params.tech ?? "Anushik";
  const techFull = TECH_FULL[techName] ?? techName;

  const timeRange = `${start} – ${addMinutes(start, duration)}`;
  const cancelBy = addMinutes(start, -CANCEL_WINDOW);

  const [notes, setNotes] = useState("");

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.grabber} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Review your booking</Text>
          <Text style={styles.subtitle}>Nothing to pay now — pay at the venue.</Text>

          {/* Summary card */}
          <View style={styles.card}>
            <View style={styles.serviceRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(name)}</Text>
              </View>
              <View style={styles.serviceBody}>
                <Text style={styles.serviceName}>{name}</Text>
                <Text style={styles.serviceMeta}>
                  {duration} min · {category}
                </Text>
              </View>
              <Text style={styles.servicePrice}>{money(price)}</Text>
            </View>

            <View style={styles.divider} />

            <DetailRow label="Date" value={dateLabel} />
            <DetailRow label="Time" value={timeRange} />
            <DetailRow label="Technician" value={techFull} />
            <DetailRow
              label="Where"
              value={VENUE.name}
              sub={VENUE.address}
            />
          </View>

          {/* Notes */}
          <Text style={styles.notesLabel}>
            Notes <Text style={styles.notesOptional}>· optional</Text>
          </Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything we should know? Allergies, styling goals, arriving with a friend..."
            placeholderTextColor={Colors.textLight}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Booking notes"
          />

          {/* Cancellation banner */}
          <View style={styles.banner}>
            <View style={styles.bannerDot} />
            <Text style={styles.bannerText}>
              Free cancellation until{" "}
              <Text style={styles.bold}>
                {cancelBy} on {dateShort}
              </Text>
              . After that a <Text style={styles.bold}>{money(CANCEL_FEE)}</Text> fee may apply.
            </Text>
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.ctaBar}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              router.replace({
                pathname: "/booking/confirmed",
                params: {
                  name,
                  price: String(price),
                  duration: String(duration),
                  start,
                  dateLabel,
                  dateShort,
                  tech: techName,
                },
              })
            }
            accessibilityRole="button"
            accessibilityLabel="Confirm booking"
          >
            <LinearGradient
              colors={PrimaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>Confirm booking</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueWrap}>
        <Text style={styles.detailValue}>{value}</Text>
        {sub ? <Text style={styles.detailSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.card },
  flex: { flex: 1 },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D5D5DB",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  scroll: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 },

  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.6, color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 6 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#F1F1F4",
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FBD5D0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: "#C2554F" },
  serviceBody: { flex: 1, minWidth: 0, gap: 3 },
  serviceName: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  serviceMeta: { fontSize: 13, color: Colors.textSecondary },
  servicePrice: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },

  divider: { height: 1, backgroundColor: "#F1F1F4", marginVertical: 16 },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 7,
  },
  detailLabel: { fontSize: 15, color: Colors.textSecondary },
  detailValueWrap: { flex: 1, alignItems: "flex-end" },
  detailValue: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary, textAlign: "right" },
  detailSub: { fontSize: 14, color: Colors.textSecondary, textAlign: "right", marginTop: 2 },

  notesLabel: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary, marginTop: 24 },
  notesOptional: { color: Colors.textLight, fontWeight: "500" },
  notesInput: {
    minHeight: 96,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginTop: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  banner: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FBF1E4",
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },
  bannerDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: Colors.star, marginTop: 6 },
  bannerText: { flex: 1, fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  bold: { fontWeight: "700", color: Colors.textPrimary },

  ctaBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: "#F1F1F4",
  },
  ctaButton: { height: 56, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  ctaText: { fontSize: 17, fontWeight: "700", color: Colors.white },
});
