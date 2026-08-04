import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";

// ⚠️ UI-only screen: static mock data on the frontend (no API).
// Values fall back to the "Face massage" mockup when no params are passed.
const MOCK = {
  name: "Face massage",
  category: "Face procedures",
  rating: 4.9,
  reviewCount: 128,
  duration: 45,
  price: 15000,
  about:
    "A relaxing 45-minute facial massage with cleansing, lymphatic-drainage techniques and aroma oils. Improves circulation and leaves skin visibly refreshed.",
  cancelWindow: 120,
  cancelFee: 3000,
};

function money(amount: number): string {
  return `${amount.toLocaleString("en-US")} ֏`;
}

export default function ServiceDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    name?: string;
    category?: string;
    duration?: string;
    price?: string;
  }>();

  const name = params.name ?? MOCK.name;
  const category = params.category ?? MOCK.category;
  const duration = params.duration ? Number(params.duration) : MOCK.duration;
  const price = params.price ? Number(params.price) : MOCK.price;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Hero / photo placeholder */}
        <LinearGradient
          colors={["#FBD9CC", "#F3A88F", "#EE8E77"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color="#8A3B32" />
          </TouchableOpacity>

          <Text style={styles.photoPlaceholder}>SERVICE PHOTO PLACEHOLDER</Text>

          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{category}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                ★ {MOCK.rating.toFixed(1)} · {MOCK.reviewCount}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{name}</Text>
        </LinearGradient>

        {/* Body sheet */}
        <View style={styles.sheet}>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{duration} min</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Price</Text>
              <Text style={styles.statValue}>{money(price)}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>About this service</Text>
          <Text style={styles.about}>{MOCK.about}</Text>

          {/* Choose technician */}
          <View style={styles.infoCard}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>You can choose your technician</Text>
              <Text style={styles.infoSub}>Or let us assign the next available</Text>
            </View>
          </View>

          {/* Cancellation policy */}
          <View style={styles.policyCard}>
            <View style={styles.policyHead}>
              <View style={styles.policyDot} />
              <Text style={styles.infoTitle}>Cancellation policy</Text>
            </View>
            <Text style={styles.policyText}>
              Free cancellation up to <Text style={styles.bold}>{MOCK.cancelWindow} min</Text>{" "}
              before your slot. After that a <Text style={styles.bold}>{money(MOCK.cancelFee)}</Text>{" "}
              fee may apply.
            </Text>
          </View>

          <View style={styles.payRow}>
            <View style={styles.payDot} />
            <Text style={styles.payText}>Pay at the venue — no card needed to book.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push({
              pathname: "/booking/time",
              params: { name, duration: String(duration), price: String(price) },
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Choose a time"
        >
          <LinearGradient
            colors={PrimaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Choose a time</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.card },

  hero: { height: 468, paddingHorizontal: 20, paddingBottom: 20, justifyContent: "flex-start" },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholder: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "500",
    color: "rgba(61,26,22,.35)",
  },
  pillRow: { flexDirection: "row", gap: 10, marginTop: "auto" },
  pill: {
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,.75)",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  pillText: { fontSize: 13, fontWeight: "600", color: "#3D1A16" },
  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: "#3D1A16",
    marginTop: 12,
  },

  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 16,
  },
  statRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F1F4",
  },
  statLabel: { fontSize: 13, color: Colors.textLight },
  statValue: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary, marginTop: 4 },
  about: { fontSize: 15, lineHeight: 24, color: Colors.textSecondary },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F1F4",
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  checkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FDE3DB",
    alignItems: "center",
    justifyContent: "center",
  },
  infoBody: { flex: 1, minWidth: 0, gap: 2 },
  infoTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  infoSub: { fontSize: 13, color: Colors.textSecondary },

  policyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#F1F1F4",
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  policyHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  policyDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: Colors.star },
  policyText: { fontSize: 14, lineHeight: 22, color: Colors.textSecondary },
  bold: { fontWeight: "700", color: Colors.textPrimary },

  payRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 2 },
  payDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: Colors.textLight },
  payText: { fontSize: 13, color: Colors.textLight },

  ctaBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F1F4",
  },
  ctaButton: {
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { fontSize: 17, fontWeight: "700", color: Colors.white },
});
