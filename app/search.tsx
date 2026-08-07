import { useRouter } from "expo-router";
import { Fragment } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HighlightedText } from "../src/components/HighlightedText";
import { Colors } from "../constants/colors";
import { useAuth } from "../src/hooks/useAuth";
import { useSearchSuggestions } from "../src/hooks/useSearchSuggestions";
import type { ServiceSuggestion, VenueSuggestion } from "../src/types/catalog";

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
  { bg: "#F3D08A", fg: "#8A6410" },
  { bg: "#E7C9F0", fg: "#7E4FC2" },
  { bg: "#9FD6BC", fg: "#2E6B4F" },
  { bg: "#AEC2EE", fg: "#3D5390" },
];

const dram = (amount: number) => `${amount.toLocaleString("en-US")} ֏`;

const serviceLabel = (s: ServiceSuggestion) =>
  s.categoryMatched && s.categoryName ? `${s.categoryName} — ${s.name}` : s.name;

const venueLabel = (v: VenueSuggestion) =>
  v.matchedLabel ? `${v.name} — ${v.matchedLabel}` : v.name;

/** A rounded card wrapping suggestion rows with text-column-inset dividers. */
function Section({
  title,
  children,
  rightAction,
  card = true,
}: {
  title: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
  card?: boolean;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>{title}</Text>
        {rightAction}
      </View>
      {card ? <View style={styles.card}>{children}</View> : children}
    </View>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    query,
    setQuery,
    clear,
    trimmed,
    suggestions,
    loading,
    hasQuery,
    hasResults,
    noResults,
    recents,
    recordTapThrough,
    clearRecents,
  } = useSearchSuggestions(user?.id ?? null);

  const openService = async (s: ServiceSuggestion) => {
    await recordTapThrough();
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
  };

  const openVenue = async (v: VenueSuggestion) => {
    await recordTapThrough();
    router.push(`/salon/${v.id}`);
  };

  const cancel = () => {
    clear();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, styles.searchBarActive]}>
          <View style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search venues & services"
            placeholderTextColor={Colors.textLight}
            autoFocus
            returnKeyType="search"
            // Full results list is a separate story (BOOK-68 out of scope);
            // submitting just dismisses the keyboard and keeps suggestions.
            onSubmitEditing={() => Keyboard.dismiss()}
            accessibilityLabel="Search venues and services"
          />
          {query.length > 0 ? (
            <TouchableOpacity
              onPress={clear}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={10}
              style={styles.clearButton}
            >
              <Text style={styles.clearIcon}>×</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={cancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel search"
          hitSlop={8}
          style={styles.cancel}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Live results */}
        {hasQuery && hasResults ? (
          <>
            {suggestions.services.length > 0 ? (
              <Section title="SERVICES">
                {suggestions.services.map((s, i) => (
                  <Fragment key={s.id}>
                    {i > 0 ? <View style={styles.divider} /> : null}
                    <TouchableOpacity
                      style={styles.row}
                      activeOpacity={0.7}
                      onPress={() => openService(s)}
                      accessibilityRole="button"
                      accessibilityLabel={`${serviceLabel(s)}, ${dram(s.price)}`}
                    >
                      <View
                        style={[
                          styles.tile,
                          { backgroundColor: TILE_TINTS[i % TILE_TINTS.length].bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tileText,
                            { color: TILE_TINTS[i % TILE_TINTS.length].fg },
                          ]}
                        >
                          {initials(s.name)}
                        </Text>
                      </View>
                      <HighlightedText
                        text={serviceLabel(s)}
                        query={trimmed}
                        style={styles.rowLabel}
                        numberOfLines={1}
                      />
                      <Text style={styles.price}>{dram(s.price)}</Text>
                    </TouchableOpacity>
                  </Fragment>
                ))}
              </Section>
            ) : null}

            {suggestions.venues.length > 0 ? (
              <Section title="VENUES">
                {suggestions.venues.map((v, i) => (
                  <Fragment key={v.id}>
                    {i > 0 ? <View style={styles.divider} /> : null}
                    <TouchableOpacity
                      style={styles.row}
                      activeOpacity={0.7}
                      onPress={() => openVenue(v)}
                      accessibilityRole="button"
                      accessibilityLabel={`${venueLabel(v)}${v.rating != null ? `, rated ${v.rating}` : ""}`}
                    >
                      {v.logoUrl ? (
                        <Image source={{ uri: v.logoUrl }} style={styles.venueTile} />
                      ) : (
                        <View
                          style={[
                            styles.venueTile,
                            { backgroundColor: TILE_TINTS[i % TILE_TINTS.length].bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tileText,
                              { color: TILE_TINTS[i % TILE_TINTS.length].fg },
                            ]}
                          >
                            {initials(v.name)}
                          </Text>
                        </View>
                      )}
                      <HighlightedText
                        text={venueLabel(v)}
                        query={trimmed}
                        style={styles.rowLabel}
                        numberOfLines={1}
                      />
                      {v.rating != null ? (
                        <Text style={styles.rating}>★ {v.rating.toFixed(1)}</Text>
                      ) : null}
                    </TouchableOpacity>
                  </Fragment>
                ))}
              </Section>
            ) : null}
          </>
        ) : null}

        {/* Loading (query typed, nothing yet) */}
        {hasQuery && loading && !hasResults ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : null}

        {/* No results */}
        {noResults ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsHeading}>No matches</Text>
            <Text style={styles.noResultsBody}>
              Try a different spelling, or browse services by category.
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Browse all services"
            >
              <Text style={styles.browseText}>Browse all services</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Recent searches — visible in the empty state and below live results. */}
        {recents.length > 0 ? (
          <Section
            title="RECENT"
            card={false}
            rightAction={
              <TouchableOpacity
                onPress={clearRecents}
                accessibilityRole="button"
                accessibilityLabel="Clear recent searches"
                hitSlop={8}
              >
                <Text style={styles.clearAction}>Clear</Text>
              </TouchableOpacity>
            }
          >
            <View style={styles.chipsWrap}>
              {recents.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={styles.chip}
                  onPress={() => setQuery(r)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Search ${r}`}
                  hitSlop={{ top: 6, bottom: 6 }}
                >
                  <Text style={styles.chipText} numberOfLines={1}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  searchBar: {
    flex: 1,
    minHeight: 48,
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
  searchIcon: {
    width: 15,
    height: 15,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.textPrimary },
  clearButton: { width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  clearIcon: { fontSize: 20, color: Colors.textLight, lineHeight: 22 },
  cancel: { minHeight: 44, justifyContent: "center" },
  cancelText: { fontSize: 15, fontWeight: "500", color: Colors.textSecondary },

  body: { flex: 1 },
  bodyContent: { padding: 20, paddingTop: 16, gap: 20 },

  section: { gap: 10 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: Colors.textLight,
  },
  clearAction: { fontSize: 14, fontWeight: "600", color: Colors.primary },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 57, // inset to the text column (tile 44 + gap 13)
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  venueTile: {
    width: 44,
    height: 44,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  tileText: { fontSize: 16, fontWeight: "700" },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.textPrimary },
  price: { fontSize: 14, fontWeight: "500", color: Colors.textLight },
  rating: { fontSize: 14, fontWeight: "700", color: Colors.star },

  loadingWrap: { paddingVertical: 24, alignItems: "center" },

  noResults: { paddingVertical: 24, alignItems: "center", gap: 10 },
  noResultsHeading: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  noResultsBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  browseButton: {
    marginTop: 6,
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  browseText: { fontSize: 15, fontWeight: "600", color: Colors.white },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 40,
    maxWidth: "100%",
    borderRadius: 999,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { fontSize: 14, fontWeight: "500", color: Colors.textPrimary },
});
