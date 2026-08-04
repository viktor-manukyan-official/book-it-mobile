import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";

// ⚠️ UI-only screen: everything below is static mock data on the frontend.
// No API calls — this mirrors the "Explore — venue results" design mockup.

interface MockVenue {
  id: string;
  name: string;
  initial: string;
  avatar: [string, string]; // gradient stops
  avatarFg: string;
  rating: number;
  categories: string;
  open: string;
  openColor: string;
  distance: string;
  tags: string[];
  extra: number;
  priceFrom: string;
}

const MOCK_VENUES: MockVenue[] = [
  {
    id: "lumiere",
    name: "Lumière Beauty Studio",
    initial: "L",
    avatar: ["#FFB88C", "#FF6B6B"],
    avatarFg: "#FFFFFF",
    rating: 4.9,
    categories: "Hair · Spa · Nails",
    open: "Open until 20:00",
    openColor: Colors.success,
    distance: "0.4 km · Babayan 36",
    tags: ["Aroma Spa", "Deep Tissue"],
    extra: 9,
    priceFrom: "from 8,000 ֏",
  },
  {
    id: "narine",
    name: "Narine Wellness & Spa",
    initial: "N",
    avatar: ["#C9E8D8", "#8FCDB0"],
    avatarFg: "#2E6B4F",
    rating: 4.8,
    categories: "Spa · Massage",
    open: "Open until 22:00",
    openColor: Colors.success,
    distance: "1.2 km · Saryan St",
    tags: ["Hot Stone", "Hammam"],
    extra: 6,
    priceFrom: "from 10,000 ֏",
  },
  {
    id: "ararat",
    name: "Ararat Day Spa",
    initial: "A",
    avatar: ["#D7E7FF", "#A8BDF0"],
    avatarFg: "#3D5390",
    rating: 4.6,
    categories: "Spa · Clinic",
    open: "Opens tomorrow 10:00",
    openColor: Colors.textLight,
    distance: "2.8 km · Komitas Ave",
    tags: [],
    extra: 0,
    priceFrom: "",
  },
];

const FILTERS = ["Open now", "Top rated", "Nearby", "Spa"];

function VenueCard({ venue }: { venue: MockVenue }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: venue.avatar[1] }]}>
          <Text style={[styles.avatarText, { color: venue.avatarFg }]}>{venue.initial}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.venueName} numberOfLines={1}>
              {venue.name}
            </Text>
            <Text style={styles.rating}>★ {venue.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.categories} numberOfLines={1}>
            {venue.categories}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.openWrap}>
              <View style={[styles.dot, { backgroundColor: venue.openColor }]} />
              <Text style={[styles.openText, { color: venue.openColor }]} numberOfLines={1}>
                {venue.open}
              </Text>
            </View>
            <Text style={styles.metaDim} numberOfLines={1}>
              · {venue.distance}
            </Text>
          </View>
        </View>
      </View>

      {(venue.tags.length > 0 || venue.priceFrom) && (
        <View style={styles.tagRow}>
          {venue.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
          <Text style={styles.tagDim} numberOfLines={1}>
            {venue.extra > 0 ? `+${venue.extra} · ` : ""}
            {venue.priceFrom}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ExploreScreen() {
  const [search, setSearch] = useState("spa");
  const [active, setActive] = useState<string>("Open now");

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_VENUES;
    return MOCK_VENUES.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.categories.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [search]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Title + location */}
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText}>Yerevan · Kentron</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, search.length > 0 && styles.searchBarActive]}>
          <Ionicons
            name="search-outline"
            size={18}
            color={search.length > 0 ? Colors.primary : Colors.textLight}
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
          <TouchableOpacity
            onPress={() => setSearch("")}
            accessibilityRole="button"
            accessibilityLabel="Cancel search"
          >
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
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
          const on = active === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.chip, on ? styles.chipActive : styles.chipInactive]}
              onPress={() => setActive(on ? "" : f)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={f}
            >
              <Text style={on ? styles.chipTextActive : styles.chipTextInactive}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.resultCount}>
          {results.length} {results.length === 1 ? "venue" : "venues"}
          {search.trim() ? ` match "${search.trim()}"` : ""}
        </Text>
        {results.length === 0 ? (
          <Text style={styles.dimText}>No venues found. Try a different search.</Text>
        ) : (
          results.map((v) => <VenueCard key={v.id} venue={v} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBlock: { paddingHorizontal: 20, paddingTop: 8, gap: 3 },
  title: { fontSize: 30, fontWeight: "700", letterSpacing: -0.6, color: Colors.textPrimary },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: Colors.primary },
  locationText: { fontSize: 13, color: Colors.textSecondary },

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
  resultCount: { fontSize: 13, color: Colors.textLight },
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
  cardTop: { flexDirection: "row", gap: 13 },
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
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  openWrap: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  dot: { width: 5, height: 5, borderRadius: 999 },
  openText: { fontSize: 12, fontWeight: "500" },
  metaDim: { flex: 1, fontSize: 12, color: Colors.textLight },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tag: { backgroundColor: Colors.background, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary },
  tagDim: { flex: 1, fontSize: 12, color: Colors.textLight },
});
