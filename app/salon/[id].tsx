import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";
import type { ServiceLite, TeamMember } from "../../src/types/catalog";

type Tab = "services" | "team" | "about";

// ⚠️ UI-only screen: static mock data on the frontend (no API).
// Mirrors the "Venue profile — services" design mockup.
const MOCK_VENUE = {
  name: "Lumière Beauty Studio",
  address: "Babayan 36",
  city: "Yerevan",
  distanceKm: 0.4,
  rating: 4.9,
  reviewCount: 128,
  openNow: true,
  hoursToday: "9:00–20:00",
  closedNote: "Closed Sundays",
  about:
    "Lumière Beauty Studio is a full-service salon in the heart of Yerevan, offering hair, spa, and nail care by a team of senior specialists. Walk-ins welcome; booking recommended for weekends.",
  services: [
    { id: "s1", name: "Face massage", description: null, duration: 45, price: 15000, currency: "AMD", categoryName: "Spa" },
    { id: "s2", name: "Aroma Spa Ritual", description: null, duration: 90, price: 25000, currency: "AMD", categoryName: "Spa" },
    { id: "s3", name: "Deep Tissue Massage", description: null, duration: 60, price: 18000, currency: "AMD", categoryName: "Spa" },
    { id: "s4", name: "Hot Stone Therapy", description: null, duration: 75, price: 22000, currency: "AMD", categoryName: "Spa" },
    { id: "s5", name: "Balayage & Gloss", description: null, duration: 150, price: 45000, currency: "AMD", categoryName: "Hair" },
    { id: "s6", name: "Keratin Smoothing", description: null, duration: 120, price: 38000, currency: "AMD", categoryName: "Hair" },
    { id: "s7", name: "Haircut & Style", description: null, duration: 45, price: 9000, currency: "AMD", categoryName: "Hair" },
    { id: "s8", name: "Blow Dry", description: null, duration: 30, price: 6000, currency: "AMD", categoryName: "Hair" },
    { id: "s9", name: "Gel Manicure", description: null, duration: 60, price: 8000, currency: "AMD", categoryName: "Nails" },
    { id: "s10", name: "Classic Pedicure", description: null, duration: 60, price: 10000, currency: "AMD", categoryName: "Nails" },
    { id: "s11", name: "Nail Art Add-on", description: null, duration: 30, price: 4000, currency: "AMD", categoryName: "Nails" },
  ] as ServiceLite[],
  team: [
    { id: "t1", firstName: "Anushik", lastName: "Movsisyan", jobTitle: "Massage Therapist", bio: null },
    { id: "t2", firstName: "Karen", lastName: "Grigoryan", jobTitle: "Senior Stylist", bio: null },
    { id: "t3", firstName: "Mariam", lastName: "Petrosyan", jobTitle: "Nail Artist", bio: null },
  ] as TeamMember[],
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function money(amount: number): string {
  return `${amount.toLocaleString("en-US")} ֏`;
}

const TINTS: { bg: string; fg: string }[] = [
  { bg: "#FBD5D0", fg: "#C2554F" },
  { bg: "#E9D9F7", fg: "#7E4FC2" },
  { bg: "#FCE0C4", fg: "#B4783F" },
  { bg: "#D3EAD9", fg: "#3F8A5C" },
  { bg: "#D6E4FB", fg: "#3F5FB4" },
];

function ServiceRow({
  service,
  index,
  onBook,
}: {
  service: ServiceLite;
  index: number;
  onBook: () => void;
}) {
  const tint = TINTS[index % TINTS.length];
  return (
    <View style={styles.serviceCard}>
      <View style={[styles.serviceIcon, { backgroundColor: tint.bg }]}>
        <Text style={[styles.serviceIconText, { color: tint.fg }]}>
          {initials(service.name)}
        </Text>
      </View>
      <View style={styles.serviceBody}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {service.name}
        </Text>
        <Text style={styles.serviceMeta}>
          {service.duration} min ·{" "}
          <Text style={styles.servicePrice}>{money(service.price)}</Text>
        </Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onBook}
        accessibilityRole="button"
        accessibilityLabel={`Book ${service.name}`}
      >
        <LinearGradient
          colors={PrimaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bookButton}
        >
          <Text style={styles.bookText}>Book</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function TeamRow({ member, index }: { member: TeamMember; index: number }) {
  const tint = TINTS[index % TINTS.length];
  const name = `${member.firstName} ${member.lastName}`.trim();
  return (
    <View style={styles.serviceCard}>
      <View style={[styles.serviceIcon, { backgroundColor: tint.bg }]}>
        <Text style={[styles.serviceIconText, { color: tint.fg }]}>
          {initials(name)}
        </Text>
      </View>
      <View style={styles.serviceBody}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {name}
        </Text>
        {member.jobTitle ? (
          <Text style={styles.serviceMeta}>{member.jobTitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.action}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={16} color={Colors.textPrimary} />
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function TabItem({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.tabItem}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
        {count != null ? <Text style={styles.tabCount}> {count}</Text> : null}
      </Text>
      {active ? <View style={styles.tabUnderline} /> : null}
    </TouchableOpacity>
  );
}

export default function VenueProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const venue = MOCK_VENUE;
  const [tab, setTab] = useState<Tab>("services");
  const [category, setCategory] = useState<string>("All");

  // Distinct service categories for the filter chips, "All" first.
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of venue.services) if (s.categoryName) set.add(s.categoryName);
    return ["All", ...set];
  }, [venue.services]);

  const shownServices = useMemo(
    () =>
      category === "All"
        ? venue.services
        : venue.services.filter((s) => s.categoryName === category),
    [venue.services, category],
  );

  const onBook = (service: ServiceLite) =>
    router.push({
      pathname: "/service/[id]",
      params: {
        id: service.id,
        name: service.name,
        category: service.categoryName ?? "",
        duration: String(service.duration),
        price: String(service.price),
      },
    });

  const openDirections = () => {
    const q = encodeURIComponent(`${venue.name} ${venue.address} ${venue.city}`);
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${q}`,
      default: `https://www.google.com/maps/search/?api=1&query=${q}`,
    });
    if (url) void Linking.openURL(url);
  };

  const onShare = () =>
    void Share.share({ message: `${venue.name} — ${venue.address}, ${venue.city}` });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Hero */}
        <LinearGradient
          colors={["#FFB88C", "#FF7E6B", "#FF6B6B"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={styles.circleButton}
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color="#8A3B32" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.circleButton}
              accessibilityRole="button"
              accessibilityLabel="Save venue"
            >
              <Ionicons name="heart-outline" size={20} color="#8A3B32" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Floating info card */}
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardHeadText}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <Text style={styles.venueAddr}>
                  {venue.address}, {venue.city}
                  {venue.distanceKm != null ? ` · ${venue.distanceKm.toFixed(1)} km` : ""}
                </Text>
              </View>
              <Text style={styles.rating}>
                ★ {venue.rating.toFixed(1)}{" "}
                <Text style={styles.reviewCount}>({venue.reviewCount})</Text>
              </Text>
            </View>
            <View style={styles.openRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: venue.openNow ? Colors.success : Colors.textLight },
                ]}
              />
              <Text
                style={[
                  styles.openText,
                  { color: venue.openNow ? Colors.success : Colors.textLight },
                ]}
              >
                {venue.openNow ? `Open today ${venue.hoursToday ?? ""}`.trim() : "Closed"}
              </Text>
              {venue.closedNote ? (
                <Text style={styles.closedNote}> · {venue.closedNote}</Text>
              ) : null}
            </View>
            <View style={styles.actions}>
              <ActionButton icon="call-outline" label="Call" onPress={openDirections} />
              <ActionButton icon="navigate-outline" label="Directions" onPress={openDirections} />
              <ActionButton icon="share-outline" label="Share" onPress={onShare} />
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TabItem
            label="Services"
            count={venue.services.length}
            active={tab === "services"}
            onPress={() => setTab("services")}
          />
          <TabItem
            label="Team"
            count={venue.team.length}
            active={tab === "team"}
            onPress={() => setTab("team")}
          />
          <TabItem label="About" active={tab === "about"} onPress={() => setTab("about")} />
        </View>

        {tab === "services" && (
          <>
            {categories.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
                style={styles.chipsScroll}
              >
                {categories.map((c) => {
                  const on = c === category;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, on ? styles.chipActive : styles.chipInactive]}
                      onPress={() => setCategory(c)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={on ? styles.chipTextActive : styles.chipTextInactive}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            <View style={styles.list}>
              {shownServices.length === 0 ? (
                <Text style={styles.dimText}>No services in this category.</Text>
              ) : (
                shownServices.map((s, i) => (
                  <ServiceRow key={s.id} service={s} index={i} onBook={() => onBook(s)} />
                ))
              )}
            </View>
          </>
        )}

        {tab === "team" && (
          <View style={styles.list}>
            {venue.team.length === 0 ? (
              <Text style={styles.dimText}>No team members listed yet.</Text>
            ) : (
              venue.team.map((m, i) => <TeamRow key={m.id} member={m} index={i} />)
            )}
          </View>
        )}

        {tab === "about" && (
          <View style={styles.list}>
            <Text style={styles.about}>{venue.about}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  dimText: { fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  hero: { height: 232, paddingHorizontal: 20, paddingBottom: 18 },
  heroButtons: { flexDirection: "row", justifyContent: "space-between" },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrap: { paddingHorizontal: 20, marginTop: -34 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardHeadText: { flex: 1, minWidth: 0, gap: 4 },
  venueName: { fontSize: 21, fontWeight: "700", letterSpacing: -0.3, color: Colors.textPrimary },
  venueAddr: { fontSize: 13, color: Colors.textSecondary },
  rating: { fontSize: 14, fontWeight: "600", color: Colors.star },
  reviewCount: { fontSize: 13, fontWeight: "500", color: Colors.textLight },
  openRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 999 },
  openText: { fontSize: 12, fontWeight: "500" },
  closedNote: { fontSize: 12, fontWeight: "400", color: Colors.textLight, marginLeft: -4 },
  actions: { flexDirection: "row", gap: 8 },
  action: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  tabsRow: {
    flexDirection: "row",
    gap: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 14,
  },
  tabItem: { paddingBottom: 10 },
  tabText: { fontSize: 15, fontWeight: "500", color: Colors.textLight },
  tabTextActive: { color: Colors.textPrimary, fontWeight: "600" },
  tabCount: { color: Colors.textLight, fontWeight: "500" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  chipsScroll: { flexGrow: 0, marginBottom: 12 },
  chipsRow: { paddingHorizontal: 20, gap: 8 },
  chip: { height: 34, borderRadius: 999, paddingHorizontal: 14, justifyContent: "center" },
  chipActive: { backgroundColor: Colors.textPrimary },
  chipInactive: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipTextActive: { fontSize: 13, fontWeight: "500", color: Colors.white },
  chipTextInactive: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  list: { paddingHorizontal: 20, gap: 12 },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 13,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  serviceIcon: { width: 60, height: 60, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  serviceIconText: { fontSize: 20, fontWeight: "700" },
  serviceBody: { flex: 1, minWidth: 0, gap: 5 },
  serviceName: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  serviceMeta: { fontSize: 13, color: Colors.textSecondary },
  servicePrice: { fontWeight: "700", color: Colors.textPrimary },
  bookButton: { height: 40, borderRadius: 999, paddingHorizontal: 22, justifyContent: "center", alignItems: "center" },
  bookText: { fontSize: 14, fontWeight: "600", color: Colors.white },
  about: { fontSize: 15, lineHeight: 23, color: Colors.textSecondary },
});
