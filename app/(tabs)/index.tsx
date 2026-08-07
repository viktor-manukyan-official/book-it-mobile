import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { useAuth } from "../../src/hooks/useAuth";
import { useHomeVenue } from "../../src/hooks/useHomeVenue";
import { fetchUnreadCount } from "../../src/services/notificationsApi";
import type { ServiceLite, VenueDetail } from "../../src/types/catalog";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Gradient tints for generated tiles, cycled by index (design brief §3.12).
const TILE_TINTS: { bg: string; fg: string }[] = [
  { bg: "#FF8E72", fg: "#FFFFFF" },
  { bg: "#F3D08A", fg: "#8A6410" },
  { bg: "#E7C9F0", fg: "#7E4FC2" },
  { bg: "#9FD6BC", fg: "#2E6B4F" },
  { bg: "#AEC2EE", fg: "#3D5390" },
];

const dram = (amount: number) => `${amount.toLocaleString("en-US")} ֏`;

/** Header greeting + notifications bell + avatar. */
function Header({
  firstName,
  avatarInitials,
  photoUrl,
  unread,
  onProfile,
  onNotifications,
}: {
  firstName: string;
  avatarInitials: string;
  photoUrl?: string | null;
  unread: number;
  onProfile: () => void;
  onNotifications: () => void;
}) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerText}>
        <Text style={styles.greeting} numberOfLines={1}>
          Hi, {firstName} 👋
        </Text>
        <Text style={styles.title}>Book your visit</Text>
      </View>
      <TouchableOpacity
        style={styles.bell}
        onPress={onNotifications}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        hitSlop={8}
      >
        <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
        {unread > 0 ? (
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>{unread > 9 ? "9+" : unread}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.userAvatar}
        onPress={onProfile}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        hitSlop={8}
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.userAvatarImage} />
        ) : (
          <Text style={styles.userAvatarText}>{avatarInitials}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

/** Search entry point — tapping opens the Search screen (no results on Home). */
function SearchEntry({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.searchWrap}>
      <TouchableOpacity
        style={styles.searchBar}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="search"
        accessibilityLabel="Search venues and services"
      >
        <View style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>Search venues & services</Text>
      </TouchableOpacity>
    </View>
  );
}

/** The single venue the customer is browsing. */
function VenueCard({ venue, onPress }: { venue: VenueDetail; onPress: () => void }) {
  const tint = TILE_TINTS[0];
  const where = [venue.address, venue.city].filter(Boolean).join(" · ");
  const openState = venue.openNow
    ? venue.hoursToday
      ? `Open today ${venue.hoursToday}`
      : "Open today"
    : "Closed today";
  return (
    <TouchableOpacity
      style={styles.venueCard}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}, ${openState}`}
    >
      {venue.logoUrl ? (
        <Image source={{ uri: venue.logoUrl }} style={styles.venueTile} />
      ) : (
        <View style={[styles.venueTile, { backgroundColor: tint.bg }]}>
          <Text style={[styles.venueTileText, { color: tint.fg }]}>
            {initials(venue.name)}
          </Text>
        </View>
      )}
      <View style={styles.venueBody}>
        <Text style={styles.venueName} numberOfLines={1}>
          {venue.name}
        </Text>
        {where ? (
          <Text style={styles.venueAddress} numberOfLines={1}>
            {where}
          </Text>
        ) : null}
        <View style={styles.openWrap}>
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
            numberOfLines={1}
          >
            {openState}
          </Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

/** One service row: tile, name, description, duration, price, Book. */
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
  const tint = TILE_TINTS[index % TILE_TINTS.length];
  return (
    <TouchableOpacity
      style={styles.serviceCard}
      activeOpacity={0.85}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${service.name}, ${service.duration} minutes, ${dram(service.price)}`}
    >
      <View style={[styles.serviceTile, { backgroundColor: tint.bg }]}>
        <Text style={[styles.serviceTileText, { color: tint.fg }]}>
          {initials(service.name)}
        </Text>
      </View>
      <View style={styles.serviceBody}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {service.name}
        </Text>
        {service.description ? (
          <Text style={styles.serviceDesc} numberOfLines={1}>
            {service.description}
          </Text>
        ) : null}
        <View style={styles.serviceMetaRow}>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{service.duration} min</Text>
          </View>
          <Text style={styles.price}>{dram(service.price)}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.bookButton}
        onPress={onBook}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Book ${service.name}`}
        hitSlop={6}
      >
        <Text style={styles.bookText}>Book</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

/** Skeleton row matching the real service-row geometry (no layout shift). */
function SkeletonRow() {
  return (
    <View style={styles.serviceCard}>
      <View style={[styles.serviceTile, styles.skelBlock]} />
      <View style={styles.serviceBody}>
        <View style={[styles.skelLine, { width: "60%" }]} />
        <View style={[styles.skelLine, { width: "85%" }]} />
        <View style={[styles.skelLine, { width: "40%" }]} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    venue,
    loading,
    refreshing,
    error,
    categories,
    selectedCategoryId,
    selectCategory,
    filteredServices,
    groupLabel,
    hasServices,
    notify,
    registerNotify,
    refresh,
    retry,
  } = useHomeVenue();

  const firstName = user?.firstName ?? "there";
  const avatarInitials = user
    ? initials(`${user.firstName} ${user.lastName}`)
    : initials(firstName);

  // Unread notifications badge — refreshed whenever Home regains focus.
  const [unread, setUnread] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void fetchUnreadCount()
        .then((n) => active && setUnread(n))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );

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
      params: {
        serviceId: s.id,
        name: s.name,
        duration: String(s.duration),
        price: String(s.price),
      },
    });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        firstName={firstName}
        avatarInitials={avatarInitials}
        photoUrl={user?.profileImageUrl}
        unread={unread}
        onProfile={() => router.push("/profile")}
        onNotifications={() => router.push("/notifications")}
      />
      <SearchEntry onPress={() => router.push("/search")} />

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
          />
        }
      >
        {error ? (
          <View style={styles.centered}>
            <Text style={styles.dimText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retry}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <>
            <View style={[styles.venueCard, styles.venueCardSkeleton]}>
              <View style={[styles.venueTile, styles.skelBlock]} />
              <View style={styles.venueBody}>
                <View style={[styles.skelLine, { width: "70%" }]} />
                <View style={[styles.skelLine, { width: "50%" }]} />
                <View style={[styles.skelLine, { width: "35%" }]} />
              </View>
            </View>
            <View style={styles.skelServices}>
              {[0, 1, 2].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </View>
          </>
        ) : venue ? (
          <>
            <VenueCard venue={venue} onPress={() => router.push(`/salon/${venue.id}`)} />

            {hasServices ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                  style={styles.chipsScroll}
                >
                  {[{ id: null, name: "All" }, ...categories].map((c) => {
                    const on = selectedCategoryId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id ?? "all"}
                        style={[styles.chip, on ? styles.chipActive : styles.chipInactive]}
                        onPress={() => selectCategory(c.id)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={c.name}
                      >
                        <Text style={on ? styles.chipTextActive : styles.chipTextInactive}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{groupLabel}</Text>
                  <Text style={styles.sectionCount}>
                    {filteredServices.length}{" "}
                    {filteredServices.length === 1 ? "service" : "services"}
                  </Text>
                </View>

                <View style={styles.serviceList}>
                  {filteredServices.map((s, i) => (
                    <ServiceRow
                      key={s.id}
                      service={s}
                      index={i}
                      onOpen={() => openService(s)}
                      onBook={() => bookService(s)}
                    />
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIllustration}>🗓️</Text>
                <Text style={styles.emptyHeading}>No services yet</Text>
                <Text style={styles.dimText}>
                  This venue hasn&apos;t opened booking yet. We&apos;ll let you know the
                  moment it does.
                </Text>
                <TouchableOpacity
                  style={[styles.notifyButton, notify === "done" && styles.notifyButtonDone]}
                  onPress={registerNotify}
                  disabled={notify !== "idle"}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Notify me when booking opens"
                >
                  {notify === "sending" ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.notifyText}>
                      {notify === "done" ? "We'll notify you ✓" : "Notify me"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: { gap: 3, flex: 1, minWidth: 0 },
  greeting: { fontSize: 13, color: Colors.textLight },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5, color: Colors.textPrimary },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#FFD0C4",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  userAvatarImage: { width: 44, height: 44, borderRadius: 999 },
  userAvatarText: { fontSize: 15, fontWeight: "600", color: "#B4453F" },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  bellBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.white },

  searchWrap: { paddingHorizontal: 20, paddingTop: 20 },
  searchBar: {
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  searchIcon: {
    width: 15,
    height: 15,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.textLight,
  },
  searchPlaceholder: { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.textLight },

  scrollBody: { padding: 20, paddingTop: 16, gap: 16 },

  chipsScroll: { flexGrow: 0, marginHorizontal: -20 },
  chipsRow: { paddingHorizontal: 20, gap: 8 },
  chip: { height: 44, borderRadius: 999, paddingHorizontal: 16, justifyContent: "center" },
  chipActive: { backgroundColor: Colors.textPrimary },
  chipInactive: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipTextActive: { fontSize: 13, fontWeight: "500", color: Colors.white },
  chipTextInactive: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 19, fontWeight: "600", letterSpacing: -0.3, color: Colors.textPrimary },
  sectionCount: { fontSize: 13, fontWeight: "500", color: Colors.primary },

  // Venue card
  venueCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  venueCardSkeleton: { opacity: 0.7 },
  venueTile: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  venueTileText: { fontSize: 22, fontWeight: "700" },
  venueBody: { flex: 1, minWidth: 0, gap: 4 },
  venueName: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  venueAddress: { fontSize: 13, color: Colors.textSecondary },
  openWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 999 },
  openText: { fontSize: 12, fontWeight: "500" },
  chevron: { fontSize: 20, color: "#C8C8CF" },

  // Service list
  serviceList: { gap: 14 },
  skelServices: { gap: 14 },
  serviceCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  serviceTile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceTileText: { fontSize: 20, fontWeight: "700" },
  serviceBody: { flex: 1, minWidth: 0, gap: 5 },
  serviceName: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  serviceDesc: { fontSize: 13, color: Colors.textSecondary },
  serviceMetaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  durationBadge: {
    backgroundColor: Colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationText: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary },
  price: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  bookButton: {
    minWidth: 64,
    height: 44,
    borderRadius: 999,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  bookText: { fontSize: 14, fontWeight: "600", color: Colors.white },

  // Skeletons
  skelBlock: { backgroundColor: "#ECECEF" },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: "#ECECEF" },

  // States
  centered: { paddingVertical: 48, justifyContent: "center", alignItems: "center", gap: 16 },
  dimText: { fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  retryButton: {
    height: 44,
    borderRadius: 999,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  retryText: { fontSize: 15, fontWeight: "600", color: Colors.white },

  emptyState: { paddingVertical: 32, alignItems: "center", gap: 12 },
  emptyIllustration: { fontSize: 48 },
  emptyHeading: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  notifyButton: {
    marginTop: 8,
    minWidth: 140,
    height: 48,
    borderRadius: 999,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  notifyButtonDone: { backgroundColor: Colors.success },
  notifyText: { fontSize: 15, fontWeight: "600", color: Colors.white },
});
