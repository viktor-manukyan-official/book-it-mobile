import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { useExploreVenues, type ExploreQuery } from "../../src/hooks/useExploreVenues";
import type { VenueCard } from "../../src/types/catalog";

const CITIES = ["Yerevan", "Gyumri", "Vanadzor"];
const DEFAULT_CITY = "Yerevan";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const TILE_TINTS: { bg: string; fg: string }[] = [
  { bg: "#FF8E72", fg: "#FFFFFF" },
  { bg: "#9FD6BC", fg: "#2E6B4F" },
  { bg: "#AEC2EE", fg: "#3D5390" },
  { bg: "#E7C9F0", fg: "#7E4FC2" },
  { bg: "#F3D08A", fg: "#8A6410" },
];

const dram = (amount: number) => `${amount.toLocaleString("en-US")} ֏`;

function VenueResultCard({
  venue,
  index,
  onPress,
}: {
  venue: VenueCard;
  index: number;
  onPress: () => void;
}) {
  const tint = TILE_TINTS[index % TILE_TINTS.length];
  const pills = (venue.serviceNames ?? []).slice(0, 2);
  const overflow = Math.max(0, venue.serviceCount - pills.length);
  const status = venue.statusLabel ?? (venue.openNow ? "Open" : "Closed");
  const street = venue.address ?? "";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}, ${status}`}
    >
      <View style={styles.cardTop}>
        {venue.logoUrl ? (
          <Image source={{ uri: venue.logoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
            <Text style={[styles.avatarText, { color: tint.fg }]}>{initials(venue.name)}</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.venueName} numberOfLines={1}>
              {venue.name}
            </Text>
            {venue.rating != null ? (
              <Text style={styles.rating}>★ {venue.rating.toFixed(1)}</Text>
            ) : (
              <Text style={styles.newBadge}>New</Text>
            )}
          </View>
          {venue.categoryTags.length > 0 ? (
            <Text style={styles.categories} numberOfLines={1}>
              {venue.categoryTags.join(" · ")}
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
                {status}
              </Text>
            </View>
            {street ? (
              <Text style={styles.metaDim} numberOfLines={1}>
                {" · "}
                {street}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {(pills.length > 0 || venue.priceFrom != null) && (
        <View style={styles.tagRow}>
          {pills.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>
                {t}
              </Text>
            </View>
          ))}
          <Text style={styles.tagDim} numberOfLines={1}>
            {overflow > 0 ? `+${overflow} · ` : ""}
            {venue.priceFrom != null ? `from ${dram(venue.priceFrom)}` : ""}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, styles.skel]} />
        <View style={styles.cardBody}>
          <View style={[styles.skelLine, { width: "60%" }]} />
          <View style={[styles.skelLine, { width: "45%" }]} />
          <View style={[styles.skelLine, { width: "70%" }]} />
        </View>
      </View>
    </View>
  );
}

function Chip({
  label,
  on,
  onPress,
  disabled,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, on ? styles.chipActive : styles.chipInactive, disabled && styles.chipDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: on, disabled: !!disabled }}
      accessibilityLabel={label}
    >
      <Text
        style={[
          on ? styles.chipTextActive : styles.chipTextInactive,
          disabled && styles.chipTextDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [topRated, setTopRated] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);

  const query: ExploreQuery = useMemo(
    () => ({ search, openNow, topRated, categoryId, city }),
    [search, openNow, topRated, categoryId, city],
  );

  const {
    venues,
    categories,
    totalItems,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh,
    retry,
    loadMore,
  } = useExploreVenues(query);

  // Re-running after a filter change scrolls back to the top of the list.
  const listRef = useRef<FlatList<VenueCard>>(null);
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [openNow, topRated, categoryId, city]);

  const clearFilters = () => {
    setOpenNow(false);
    setTopRated(false);
    setCategoryId(null);
  };

  const cancel = () => {
    setSearch("");
    clearFilters();
  };

  const nearbyDisabled = () =>
    Alert.alert("Enable location", "Turn on location to sort venues by distance.");

  const hasQuery = search.trim().length > 0;
  const filtersActive = hasQuery || openNow || topRated || categoryId != null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Explore</Text>
        <TouchableOpacity
          style={styles.locationRow}
          onPress={() => setCityPickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Location: ${city}. Change city`}
          hitSlop={8}
        >
          <View style={styles.locationDot} />
          <Text style={styles.locationText}>{city}</Text>
          <Text style={styles.locationChevron}>⌄</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, hasQuery && styles.searchBarActive]}>
          <View
            style={[styles.searchIcon, { borderColor: hasQuery ? Colors.primary : Colors.textLight }]}
          />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search venues & services"
            placeholderTextColor={Colors.textLight}
            returnKeyType="search"
            accessibilityLabel="Search venues and services"
          />
          {filtersActive ? (
            <TouchableOpacity
              onPress={cancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel search"
              hitSlop={8}
            >
              <Text style={styles.cancel}>Cancel</Text>
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
        <Chip label="Open now" on={openNow} onPress={() => setOpenNow((v) => !v)} />
        <Chip label="Top rated" on={topRated} onPress={() => setTopRated((v) => !v)} />
        <Chip label="Nearby" on={false} disabled onPress={nearbyDisabled} />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            on={categoryId === c.id}
            onPress={() => setCategoryId((cur) => (cur === c.id ? null : c.id))}
          />
        ))}
      </ScrollView>

      {loading ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultCount}> </Text>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </ScrollView>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.dimText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={retry}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : venues.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyHeading}>No venues found</Text>
          <Text style={styles.dimText}>Try widening your search or removing some filters.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={clearFilters}>
            <Text style={styles.primaryButtonText}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={venues}
          keyExtractor={(v) => v.id}
          renderItem={({ item, index }) => (
            <VenueResultCard
              venue={item}
              index={index}
              onPress={() => router.push(`/salon/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />
          }
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {totalItems} {totalItems === 1 ? "venue" : "venues"}
              {hasQuery ? ` match "${search.trim()}"` : ""}
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

      {/* City picker */}
      <Modal
        visible={cityPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCityPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCityPickerVisible(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Choose city</Text>
            {CITIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={styles.cityRow}
                onPress={() => {
                  setCity(c);
                  setCityPickerVisible(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: c === city }}
              >
                <Text style={[styles.cityText, c === city && styles.cityTextActive]}>{c}</Text>
                {c === city ? <Text style={styles.cityCheck}>✓</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBlock: { paddingHorizontal: 20, paddingTop: 8, gap: 3 },
  title: { fontSize: 30, fontWeight: "700", letterSpacing: -0.6, color: Colors.textPrimary },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 24 },
  locationDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: Colors.primary },
  locationText: { fontSize: 13, color: Colors.textSecondary },
  locationChevron: { fontSize: 13, color: Colors.textLight, marginTop: -2 },

  searchWrap: { paddingHorizontal: 20, paddingTop: 16 },
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
  searchBarActive: { borderWidth: 1.5, borderColor: Colors.primary },
  searchIcon: { width: 15, height: 15, borderRadius: 999, borderWidth: 2 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.textPrimary },
  cancel: { fontSize: 14, fontWeight: "500", color: Colors.textSecondary },

  chipsScroll: { flexGrow: 0, marginTop: 16 },
  chipsRow: { paddingHorizontal: 20, gap: 8 },
  chip: { minHeight: 44, borderRadius: 999, paddingHorizontal: 16, justifyContent: "center" },
  chipActive: { backgroundColor: Colors.textPrimary },
  chipInactive: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipDisabled: { opacity: 0.5 },
  chipTextActive: { fontSize: 13, fontWeight: "500", color: Colors.white },
  chipTextInactive: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  chipTextDisabled: { color: Colors.textLight },

  list: { padding: 20, paddingTop: 16, gap: 14 },
  resultCount: { fontSize: 13, color: Colors.textLight, marginBottom: 2 },
  footerLoading: { paddingVertical: 16, alignItems: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 14 },
  emptyHeading: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  dimText: { fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  primaryButton: {
    height: 44,
    borderRadius: 999,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { fontSize: 15, fontWeight: "600", color: Colors.white },

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
  cardTop: { flexDirection: "row", gap: 13 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarText: { fontSize: 24, fontWeight: "700" },
  cardBody: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  venueName: { flex: 1, fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  rating: { fontSize: 13, fontWeight: "600", color: Colors.star },
  newBadge: { fontSize: 12, fontWeight: "700", color: Colors.textLight },
  categories: { fontSize: 13, color: Colors.textSecondary },
  metaRow: { flexDirection: "row", alignItems: "center" },
  openWrap: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  dot: { width: 5, height: 5, borderRadius: 999 },
  openText: { fontSize: 12, fontWeight: "500" },
  metaDim: { flex: 1, fontSize: 12, color: Colors.textLight },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tag: {
    maxWidth: "40%",
    backgroundColor: Colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary },
  tagDim: { flex: 1, fontSize: 12, color: Colors.textLight },

  skel: { backgroundColor: "#ECECEF" },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: "#ECECEF" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    gap: 4,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary, marginBottom: 8 },
  cityRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cityText: { fontSize: 16, color: Colors.textPrimary },
  cityTextActive: { fontWeight: "700", color: Colors.primary },
  cityCheck: { fontSize: 16, color: Colors.primary },
});
