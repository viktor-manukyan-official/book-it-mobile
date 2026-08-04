import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Colors } from "../../constants/colors";
import { useAuth } from "../../src/hooks/useAuth";
import { useVenues, type VenueSort } from "../../src/hooks/useVenues";
import type { VenueCard } from "../../src/types/catalog";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Gradient tints for the venue avatar, cycled by index (design brief §3.12).
const AVATAR_TINTS: { bg: string; fg: string }[] = [
  { bg: "#FF8E72", fg: "#FFFFFF" },
  { bg: "#9FD6BC", fg: "#2E6B4F" },
  { bg: "#AEC2EE", fg: "#3D5390" },
  { bg: "#E7C9F0", fg: "#7E4FC2" },
  { bg: "#F3D08A", fg: "#8A6410" },
];

interface Filter {
  key: "openNow" | "rating" | "distance";
  label: string;
}

const FILTERS: Filter[] = [
  { key: "openNow", label: "Open now" },
  { key: "rating", label: "Top rated" },
  { key: "distance", label: "Nearby" },
];

/** One venue card in the Home list (tap → venue profile + its services). */
function VenueRow({ venue, index }: { venue: VenueCard; index: number }) {
  const router = useRouter();
  const tint = AVATAR_TINTS[index % AVATAR_TINTS.length];
  const openState = venue.openNow
    ? venue.hoursToday
      ? `Open today ${venue.hoursToday}`
      : "Open now"
    : "Closed today";
  const where = [venue.address, venue.city].filter(Boolean).join(" · ");
  const tags = venue.categoryTags;
  const shownTags = tags.slice(0, 2);
  const extra = tags.length - shownTags.length;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/salon/${venue.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}, ${venue.categoryTags.join(", ")}`}
    >
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
          <Text style={[styles.avatarText, { color: tint.fg }]}>
            {initials(venue.name)}
          </Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.venueName} numberOfLines={1}>
              {venue.name}
            </Text>
            {venue.rating != null ? (
              <Text style={styles.rating}>★ {venue.rating.toFixed(1)}</Text>
            ) : null}
          </View>
          {where ? (
            <Text style={styles.categories} numberOfLines={1}>
              {where}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
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
            {venue.distanceKm != null ? (
              <Text style={styles.metaDim} numberOfLines={1}>
                {venue.distanceKm.toFixed(1)} km
              </Text>
            ) : null}
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      {(shownTags.length > 0 || venue.priceFrom != null) && (
        <View style={styles.tagRow}>
          {shownTags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
          <Text style={styles.tagDim} numberOfLines={1}>
            {extra > 0 ? `+${extra} · ` : ""}
            {venue.priceFrom != null
              ? `from ${venue.priceFrom.toLocaleString("en-US")} ֏`
              : ""}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Filter["key"] | null>(null);

  const query = useMemo(
    () => ({
      search,
      openNow: active === "openNow",
      sort: (active === "rating"
        ? "rating"
        : active === "distance"
          ? "distance"
          : "relevance") as VenueSort,
    }),
    [search, active],
  );

  const {
    venues,
    totalItems,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh,
    retry,
    loadMore,
  } = useVenues(query);

  const firstName = user?.firstName ?? "there";
  const avatarInitials = user
    ? initials(`${user.firstName} ${user.lastName}`)
    : initials(firstName);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Greeting */}
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
          <Text style={styles.title}>Book your visit</Text>
        </View>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{avatarInitials}</Text>
        </View>
      </View>

      {/* Search — filters venues by name */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, search.length > 0 && styles.searchBarActive]}>
          <View
            style={[
              styles.searchIcon,
              { borderColor: search.length > 0 ? Colors.primary : Colors.textLight },
            ]}
          />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search venues & services"
            placeholderTextColor={Colors.textLight}
            returnKeyType="search"
            accessibilityLabel="Search venues"
          />
          {search.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearch("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text style={styles.cancel}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        {FILTERS.map((f) => {
          const on = active === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, on ? styles.chipActive : styles.chipInactive]}
              onPress={() => setActive(on ? null : f.key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={f.label}
            >
              <Text style={on ? styles.chipTextActive : styles.chipTextInactive}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.dimText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={venues}
          keyExtractor={(v) => v.id}
          renderItem={({ item, index }) => <VenueRow venue={item} index={index} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Venues</Text>
              <Text style={styles.sectionCount}>
                {totalItems} {totalItems === 1 ? "venue" : "venues"}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.dimText}>
              {search.trim()
                ? `No venues match "${search.trim()}".`
                : "No venues available yet. Check back soon."}
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : null
          }
        />
      )}
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
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#FFD0C4",
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: { fontSize: 15, fontWeight: "600", color: "#B4453F" },

  searchWrap: { paddingHorizontal: 20, paddingTop: 20 },
  searchBar: {
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  searchBarActive: { borderWidth: 1.5, borderColor: Colors.primary },
  searchIcon: { width: 15, height: 15, borderRadius: 999, borderWidth: 2 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.textPrimary },
  cancel: { fontSize: 13, fontWeight: "500", color: Colors.textLight },

  chipsScroll: { flexGrow: 0, marginTop: 16 },
  chipsRow: { paddingHorizontal: 20, gap: 8 },
  chip: { height: 36, borderRadius: 999, paddingHorizontal: 14, justifyContent: "center" },
  chipActive: { backgroundColor: Colors.textPrimary },
  chipInactive: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipTextActive: { fontSize: 13, fontWeight: "500", color: Colors.white },
  chipTextInactive: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },

  list: { padding: 20, paddingTop: 16, gap: 14 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  sectionTitle: { fontSize: 19, fontWeight: "600", letterSpacing: -0.3, color: Colors.textPrimary },
  sectionCount: { fontSize: 13, fontWeight: "500", color: Colors.primary },

  footerLoading: { paddingVertical: 16, alignItems: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  dimText: { fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 14,
    gap: 12,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTop: { flexDirection: "row", gap: 13, alignItems: "center" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "700" },
  cardBody: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  venueName: { flex: 1, fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  rating: { fontSize: 13, fontWeight: "600", color: Colors.star },
  categories: { fontSize: 13, color: Colors.textSecondary },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  openWrap: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  dot: { width: 5, height: 5, borderRadius: 999 },
  openText: { fontSize: 12, fontWeight: "500" },
  metaDim: { flex: 1, fontSize: 12, color: Colors.textLight },
  chevron: { fontSize: 20, color: "#C8C8CF" },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tag: { backgroundColor: Colors.background, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary },
  tagDim: { flex: 1, fontSize: 12, color: Colors.textLight },
  retryButton: {
    height: 44,
    borderRadius: 999,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  retryText: { fontSize: 15, fontWeight: "600", color: Colors.white },
});
