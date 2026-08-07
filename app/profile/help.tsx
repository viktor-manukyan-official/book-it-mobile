import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Fragment, useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { fetchMyBookings } from "../../src/services/bookingApi";
import type { BookingListItem } from "../../src/types/catalog";

const SUPPORT_PHONE = "+37410000000";
const SUPPORT_EMAIL = "support@bookit.am";
const SUPPORT_TELEGRAM = "https://t.me/bookit_support";

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I cancel or change a booking?",
    a: "Open the booking from My Bookings and tap Cancel booking. Free cancellation applies up to the window shown on the booking; after that a fee set by the venue may apply, settled in person.",
  },
  {
    q: "When and how do I pay?",
    a: "You pay at the venue — no card is needed to book. Prices in the app are informational.",
  },
  {
    q: "What happens if I miss my appointment?",
    a: "The venue may mark it as a no-show. Repeated no-shows can affect future bookings.",
  },
  {
    q: "Why is my booking still pending?",
    a: "Some venues confirm manually. You'll get a notification the moment the venue confirms your appointment.",
  },
];

function fmtDate(iso: string, tz: string): string {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short" }).formatToParts(
    new Date(iso),
  );
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("weekday")}, ${g("day")} ${g("month")}`;
}

export default function HelpScreen() {
  const router = useRouter();
  const [latest, setLatest] = useState<BookingListItem | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void fetchMyBookings("upcoming", 1, 1)
      .then((res) => active && setLatest(res.items[0] ?? null))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {latest ? (
          <View style={styles.bookingCard}>
            <View style={styles.bookingTile}>
              <Text style={styles.bookingTileText}>{latest.serviceName[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.bookingBody}>
              <Text style={styles.bookingKicker}>NEED HELP WITH A BOOKING?</Text>
              <Text style={styles.bookingName} numberOfLines={1}>
                {latest.serviceName} · {fmtDate(latest.startTime, latest.timezone)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.getHelp}
              onPress={() => Linking.openURL(SUPPORT_TELEGRAM)}
              accessibilityRole="button"
            >
              <Text style={styles.getHelpText}>Get help</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.section}>CONTACT US</Text>
        <View style={styles.card}>
          <ContactRow
            icon="call-outline"
            label="Call support"
            sub="+374 10 000 000 · 9:00–20:00"
            onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
          />
          <Divider />
          <ContactRow
            icon="mail-outline"
            label="Email us"
            sub={`${SUPPORT_EMAIL} · replies in 24h`}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
          <Divider />
          <ContactRow
            icon="paper-plane-outline"
            label="Chat on Telegram"
            sub="@bookit_support"
            onPress={() => Linking.openURL(SUPPORT_TELEGRAM)}
          />
        </View>

        <Text style={styles.section}>COMMON QUESTIONS</Text>
        <View style={styles.card}>
          {FAQ.map((f, i) => (
            <Fragment key={f.q}>
              {i > 0 ? <Divider /> : null}
              <TouchableOpacity
                style={styles.faqRow}
                onPress={() => setOpen(open === i ? null : i)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={styles.faqQ}>{f.q}</Text>
                <Ionicons name={open === i ? "chevron-up" : "chevron-forward"} size={18} color="#C8C8CF" />
              </TouchableOpacity>
              {open === i ? <Text style={styles.faqA}>{f.a}</Text> : null}
            </Fragment>
          ))}
        </View>

        <View style={styles.legalRow}>
          <TouchableOpacity style={styles.legalButton} onPress={() => router.push("/legal/terms")}>
            <Text style={styles.legalText}>Terms of service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.legalButton} onPress={() => router.push("/legal/privacy")}>
            <Text style={styles.legalText}>Privacy policy</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>BookIt v1.0 (build 104) · Yerevan, Armenia</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactRow({
  icon,
  label,
  sub,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.contactRow} onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.contactIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.contactText}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C8C8CF" />
    </TouchableOpacity>
  );
}

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
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
  body: { padding: 20, gap: 10, paddingBottom: 32 },

  bookingCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  bookingTile: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FBD9D6", alignItems: "center", justifyContent: "center" },
  bookingTileText: { fontSize: 18, fontWeight: "700", color: "#C2554F" },
  bookingBody: { flex: 1, minWidth: 0, gap: 2 },
  bookingKicker: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, color: Colors.textLight },
  bookingName: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  getHelp: { minHeight: 36, borderRadius: 999, paddingHorizontal: 16, borderWidth: 1.5, borderColor: Colors.primary, justifyContent: "center" },
  getHelpText: { fontSize: 14, fontWeight: "700", color: Colors.primary },

  section: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6, color: Colors.textLight, marginTop: 12 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  contactRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 13 },
  contactIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FBD9D6", alignItems: "center", justifyContent: "center" },
  contactText: { flex: 1, minWidth: 0, gap: 2 },
  contactLabel: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  contactSub: { fontSize: 13, color: Colors.textLight },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },

  faqRow: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 8 },
  faqQ: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  faqA: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21, paddingBottom: 14 },

  legalRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  legalButton: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  legalText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  footer: { fontSize: 13, color: Colors.textLight, textAlign: "center", marginTop: 8 },
});
