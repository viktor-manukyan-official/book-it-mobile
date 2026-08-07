import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useVenueProfile } from "../../src/hooks/useVenueProfile";
import type { ServiceLite, TeamMember, VenueDetail } from "../../src/types/catalog";

type Tab = "services" | "team" | "about";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const money = (amount: number) => `${amount.toLocaleString("en-US")} ֏`;

const TINTS: { bg: string; fg: string }[] = [
  { bg: "#FBD5D0", fg: "#C2554F" },
  { bg: "#E9D9F7", fg: "#7E4FC2" },
  { bg: "#FCE0C4", fg: "#B4783F" },
  { bg: "#D3EAD9", fg: "#3F8A5C" },
  { bg: "#D6E4FB", fg: "#3F5FB4" },
];

// Regular closed-day note, e.g. "Closed Sundays" — days with no open hours.
function closedDayNote(venue: VenueDetail): string | null {
  const hours = venue.workingHours ?? [];
  if (hours.length === 0) return null;
  const openDays = new Set(hours.filter((h) => !h.isClosed).map((h) => h.dayOfWeek));
  const closed = [0, 1, 2, 3, 4, 5, 6].filter((d) => !openDays.has(d));
  if (closed.length === 0 || closed.length === 7) return null;
  return `Closed ${closed.map((d) => `${WEEKDAYS[d]}s`).join(", ")}`;
}

function ServiceRow({
  service,
  index,
  onOpen,
  onBook,
}: {
  service: ServiceLite;
  index: number;
  onOpen: () => void;
  onBook: () => void;
}) {
  const tint = TINTS[index % TINTS.length];
  return (
    <TouchableOpacity
      style={styles.serviceCard}
      activeOpacity={0.85}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${service.name}, ${service.duration} minutes, ${money(service.price)}`}
    >
      <View style={[styles.serviceIcon, { backgroundColor: tint.bg }]}>
        <Text style={[styles.serviceIconText, { color: tint.fg }]}>{initials(service.name)}</Text>
      </View>
      <View style={styles.serviceBody}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {service.name}
        </Text>
        <Text style={styles.serviceMeta}>
          {service.duration} min · <Text style={styles.servicePrice}>{money(service.price)}</Text>
        </Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onBook}
        accessibilityRole="button"
        accessibilityLabel={`Book ${service.name}`}
        hitSlop={6}
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
    </TouchableOpacity>
  );
}

function TeamRow({ member, index }: { member: TeamMember; index: number }) {
  const tint = TINTS[index % TINTS.length];
  const name = `${member.firstName} ${member.lastName}`.trim();
  return (
    <View style={styles.serviceCard}>
      <View style={[styles.serviceIcon, { backgroundColor: tint.bg }]}>
        <Text style={[styles.serviceIconText, { color: tint.fg }]}>{initials(name)}</Text>
      </View>
      <View style={styles.serviceBody}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {name}
        </Text>
        {member.jobTitle ? <Text style={styles.serviceMeta}>{member.jobTitle}</Text> : null}
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { venue, loading, error, favourite, toggleFav, notify, registerNotify, retry } =
    useVenueProfile(id);

  const [tab, setTab] = useState<Tab>("services");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const shownServices = useMemo(() => {
    if (!venue) return [];
    return categoryId ? venue.services.filter((s) => s.categoryId === categoryId) : venue.services;
  }, [venue, categoryId]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const openService = (s: ServiceLite) =>
    router.push({
      pathname: "/service/[id]",
      params: {
        id: s.id,
        name: s.name,
        category: s.categoryName ?? "",
        duration: String(s.duration),
        price: String(s.price),
      },
    });

  const bookService = (s: ServiceLite) =>
    router.push({
      pathname: "/booking/time",
      params: { serviceId: s.id, name: s.name, duration: String(s.duration), price: String(s.price) },
    });

  // Hero is rendered in every state (loading / error / loaded).
  const Hero = (
    <LinearGradient
      colors={["#FFB88C", "#FF7E6B", "#FF6B6B"]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.heroButtons}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color="#8A3B32" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={toggleFav}
          accessibilityRole="button"
          accessibilityLabel={favourite ? "Remove from saved" : "Save venue"}
          accessibilityState={{ selected: favourite }}
          hitSlop={8}
        >
          <Ionicons
            name={favourite ? "heart" : "heart-outline"}
            size={20}
            color={favourite ? Colors.primary : "#8A3B32"}
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {Hero}
        <View style={styles.cardWrap}>
          <View style={[styles.card, { gap: 12 }]}>
            <View style={[styles.skelLine, { width: "70%", height: 20 }]} />
            <View style={[styles.skelLine, { width: "55%" }]} />
            <View style={[styles.skelLine, { width: "40%" }]} />
          </View>
        </View>
        <View style={[styles.list, { marginTop: 20 }]}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.serviceCard}>
              <View style={[styles.serviceIcon, styles.skel]} />
              <View style={styles.serviceBody}>
                <View style={[styles.skelLine, { width: "60%" }]} />
                <View style={[styles.skelLine, { width: "40%" }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error || !venue) {
    return (
      <View style={styles.container}>
        {Hero}
        <View style={styles.errorWrap}>
          <Text style={styles.dimText}>{error ?? "Venue unavailable."}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={retry}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const closedNote = closedDayNote(venue);
  const address = [venue.address, venue.city].filter(Boolean).join(", ");
  const statusText = venue.openNow ? `Open today ${venue.hoursToday ?? ""}`.trim() : "Closed today";

  const openDirections = () => {
    const q = encodeURIComponent(`${venue.name} ${address}`);
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${q}`,
      default: `https://www.google.com/maps/search/?api=1&query=${q}`,
    });
    if (url) void Linking.openURL(url);
  };

  const onCall = () => venue.phone && void Linking.openURL(`tel:${venue.phone}`);

  const onShare = () =>
    void Share.share({
      message: `${venue.name} — ${address}\nhttps://bookit.am/venue/${venue.id}`,
    });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {Hero}

        {/* Floating info card */}
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardHeadText}>
                <Text style={styles.venueName} numberOfLines={2}>
                  {venue.name}
                </Text>
                <Text style={styles.venueAddr} numberOfLines={1}>
                  {address}
                  {venue.distanceKm != null ? ` · ${venue.distanceKm.toFixed(1)} km` : ""}
                </Text>
              </View>
              {venue.rating != null ? (
                <Text style={styles.rating}>
                  ★ {venue.rating.toFixed(1)}
                  {venue.reviewCount != null ? (
                    <Text style={styles.reviewCount}> ({venue.reviewCount})</Text>
                  ) : null}
                </Text>
              ) : (
                <Text style={styles.newBadge}>New</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.openRow}
              onPress={() => setScheduleOpen((v) => !v)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Show weekly hours"
            >
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
                {statusText}
              </Text>
              {closedNote ? <Text style={styles.closedNote}> · {closedNote}</Text> : null}
            </TouchableOpacity>

            {scheduleOpen ? (
              <View style={styles.schedule}>
                {WEEKDAYS.map((day, d) => {
                  const rows = (venue.workingHours ?? []).filter(
                    (h) => h.dayOfWeek === d && !h.isClosed,
                  );
                  const label =
                    rows.length > 0
                      ? rows.map((r) => `${r.openTime.slice(0, 5)}–${r.closeTime.slice(0, 5)}`).join(", ")
                      : "Closed";
                  return (
                    <View key={day} style={styles.scheduleRow}>
                      <Text style={styles.scheduleDay}>{day}</Text>
                      <Text style={styles.scheduleHours}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.actions}>
              {venue.phone ? (
                <ActionButton icon="call-outline" label="Call" onPress={onCall} />
              ) : null}
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
            {venue.services.length > 0 && venue.categories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
                style={styles.chipsScroll}
              >
                {[{ id: null, name: "All" }, ...venue.categories].map((c) => {
                  const on = categoryId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id ?? "all"}
                      style={[styles.chip, on ? styles.chipActive : styles.chipInactive]}
                      onPress={() => setCategoryId(c.id)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={on ? styles.chipTextActive : styles.chipTextInactive}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            <View style={styles.list}>
              {venue.services.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyHeading}>No services yet</Text>
                  <Text style={styles.dimText}>
                    This venue hasn&apos;t opened booking yet. We&apos;ll let you know when it does.
                  </Text>
                  <TouchableOpacity
                    style={[styles.primaryButton, notify === "done" && styles.notifyDone]}
                    onPress={registerNotify}
                    disabled={notify !== "idle"}
                    accessibilityRole="button"
                    accessibilityLabel="Notify me when booking opens"
                  >
                    {notify === "sending" ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {notify === "done" ? "We'll notify you ✓" : "Notify me"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : shownServices.length === 0 ? (
                <View style={styles.inlineEmpty}>
                  <Text style={styles.dimText}>No services in this category.</Text>
                  <TouchableOpacity onPress={() => setCategoryId(null)} hitSlop={8}>
                    <Text style={styles.showAll}>Show all</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                shownServices.map((s, i) => (
                  <ServiceRow
                    key={s.id}
                    service={s}
                    index={i}
                    onOpen={() => openService(s)}
                    onBook={() => bookService(s)}
                  />
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
            {venue.about ? <Text style={styles.about}>{venue.about}</Text> : null}
            {venue.phone ? <Text style={styles.aboutMeta}>📞 {venue.phone}</Text> : null}
            {address ? <Text style={styles.aboutMeta}>📍 {address}</Text> : null}
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
    width: 44,
    height: 44,
    borderRadius: 15,
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
  cardHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  cardHeadText: { flex: 1, minWidth: 0, gap: 4 },
  venueName: { fontSize: 21, fontWeight: "700", letterSpacing: -0.3, color: Colors.textPrimary },
  venueAddr: { fontSize: 13, color: Colors.textSecondary },
  rating: { fontSize: 14, fontWeight: "600", color: Colors.star },
  reviewCount: { fontSize: 13, fontWeight: "500", color: Colors.textLight },
  newBadge: { fontSize: 13, fontWeight: "700", color: Colors.textLight },
  openRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 24 },
  dot: { width: 6, height: 6, borderRadius: 999 },
  openText: { fontSize: 12, fontWeight: "500" },
  closedNote: { fontSize: 12, fontWeight: "400", color: Colors.textLight, marginLeft: -4 },
  schedule: { gap: 6, paddingVertical: 4 },
  scheduleRow: { flexDirection: "row", justifyContent: "space-between" },
  scheduleDay: { fontSize: 13, color: Colors.textSecondary },
  scheduleHours: { fontSize: 13, color: Colors.textPrimary, fontWeight: "500" },
  actions: { flexDirection: "row", gap: 8 },
  action: {
    flex: 1,
    minHeight: 44,
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
  tabItem: { paddingBottom: 10, minHeight: 44, justifyContent: "center" },
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
  chip: { minHeight: 44, borderRadius: 999, paddingHorizontal: 16, justifyContent: "center" },
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
  bookButton: { minHeight: 44, borderRadius: 999, paddingHorizontal: 22, justifyContent: "center", alignItems: "center" },
  bookText: { fontSize: 14, fontWeight: "600", color: Colors.white },
  about: { fontSize: 15, lineHeight: 23, color: Colors.textSecondary },
  aboutMeta: { fontSize: 14, color: Colors.textPrimary, marginTop: 4 },

  emptyState: { paddingVertical: 24, alignItems: "center", gap: 12 },
  emptyHeading: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  inlineEmpty: { paddingVertical: 20, alignItems: "center", gap: 8 },
  showAll: { fontSize: 15, fontWeight: "600", color: Colors.primary },
  primaryButton: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { fontSize: 15, fontWeight: "600", color: Colors.white },
  notifyDone: { backgroundColor: Colors.success },
  errorWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 14 },

  skel: { backgroundColor: "#ECECEF" },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: "#ECECEF" },
});
