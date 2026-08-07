import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { useMyBookings, type BookingScope } from "../../src/hooks/useMyBookings";
import type { BookingListItem } from "../../src/types/catalog";

const money = (n: number) => `${n.toLocaleString("en-US")} ֏`;

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

const TILE_TINTS: { bg: string; fg: string }[] = [
  { bg: "#FBD5D0", fg: "#C2554F" },
  { bg: "#E9D9F7", fg: "#7E4FC2" },
  { bg: "#ECECEF", fg: "#6B7280" },
  { bg: "#D3EAD9", fg: "#3F8A5C" },
  { bg: "#D6E4FB", fg: "#3F5FB4" },
];

const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#FBE5C8", fg: "#8A5A12", label: "Pending" },
  confirmed: { bg: "#D6E4FB", fg: "#3F5FB4", label: "Confirmed" },
  completed: { bg: "#D3EAD9", fg: "#2E6B4F", label: "Completed" },
  cancelled: { bg: "#FBD9D6", fg: "#B4453F", label: "Cancelled" },
  no_show: { bg: "#ECECEF", fg: "#6B7280", label: "No-show" },
};

function fmtDateTime(iso: string, tz: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  // Time formatted separately — combining time fields into the same
  // formatToParts() call omits hour/minute on Hermes.
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${get("weekday")}, ${get("day")} ${get("month")} · ${time}`;
}

function BookingCard({
  item,
  index,
  past,
  onPress,
  onBookAgain,
}: {
  item: BookingListItem;
  index: number;
  past: boolean;
  onPress: () => void;
  onBookAgain: () => void;
}) {
  const tint = TILE_TINTS[index % TILE_TINTS.length];
  const status = STATUS[item.status] ?? STATUS.pending;
  const canRebook = item.status === "completed" && item.serviceActive;

  return (
    <TouchableOpacity
      style={[styles.card, past && styles.cardMuted]}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.serviceName}, ${status.label}`}
    >
      <View style={styles.cardTop}>
        <View style={[styles.tile, { backgroundColor: tint.bg }]}>
          <Text style={[styles.tileText, { color: tint.fg }]}>{initials(item.serviceName)}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {item.serviceName}
          </Text>
          <Text style={styles.technician} numberOfLines={1}>
            {item.technicianName}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.fg }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBottom}>
        <View style={styles.whenWrap}>
          <Text style={styles.when} numberOfLines={1}>
            {fmtDateTime(item.startTime, item.timezone)}
          </Text>
          <Text style={styles.venue} numberOfLines={1}>
            {item.venueName}
          </Text>
        </View>
        {past ? (
          canRebook ? (
            <TouchableOpacity onPress={onBookAgain} hitSlop={10} accessibilityRole="button">
              <Text style={styles.bookAgain}>Book again</Text>
            </TouchableOpacity>
          ) : null
        ) : (
          <Text style={styles.price}>{money(item.price)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.tile, styles.skel]} />
        <View style={styles.cardBody}>
          <View style={[styles.skelLine, { width: "60%" }]} />
          <View style={[styles.skelLine, { width: "45%" }]} />
        </View>
      </View>
      <View style={styles.divider} />
      <View style={[styles.skelLine, { width: "50%" }]} />
    </View>
  );
}

export default function BookingsScreen() {
  const router = useRouter();
  const [scope, setScope] = useState<BookingScope>("upcoming");
  const { items, loading, loadingMore, refreshing, error, hasMore, loadMore, refresh, retry } =
    useMyBookings(scope);

  // Re-query the active tab whenever the screen regains focus (reflects venue
  // status changes without a restart).
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const past = scope === "past";

  const openDetails = (item: BookingListItem) =>
    router.push({ pathname: "/booking/details", params: { id: item.id } });

  const bookAgain = (item: BookingListItem) =>
    router.push({
      pathname: "/booking/time",
      params: {
        serviceId: item.serviceId,
        name: item.serviceName,
        duration: String(item.duration),
        price: String(item.price),
        technicianId: item.technicianId, // preselected when still valid; else Any
      },
    });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>My bookings</Text>

      <View style={styles.segmented}>
        {(["upcoming", "past"] as BookingScope[]).map((s) => {
          const on = scope === s;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.segment, on && styles.segmentOn]}
              onPress={() => setScope(s)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={on ? styles.segmentTextOn : styles.segmentText}>
                {s === "upcoming" ? "Upcoming" : "Past"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.dimText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={retry}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyHeading}>
            {past ? "No past visits yet" : "No upcoming bookings"}
          </Text>
          <Text style={styles.dimText}>
            {past
              ? "Your visit history and one-tap rebooking will show up here."
              : "When you book a service, it will appear here."}
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.navigate("/(tabs)/explore")}
          >
            <Text style={styles.primaryButtonText}>Browse services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item, index }) => (
            <BookingCard
              item={item}
              index={index}
              past={past}
              onPress={() => openDetails(item)}
              onBookAgain={() => bookAgain(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />
          }
          ListFooterComponent={
            loadingMore && hasMore ? (
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
  title: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 16,
  },
  segmented: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#EBEAEE",
    borderRadius: 999,
    padding: 4,
  },
  segment: { flex: 1, minHeight: 44, borderRadius: 999, justifyContent: "center", alignItems: "center" },
  segmentOn: {
    backgroundColor: Colors.card,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
  segmentTextOn: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },

  list: { padding: 20, gap: 14 },
  footerLoading: { paddingVertical: 16, alignItems: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 12 },
  emptyHeading: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  dimText: { fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  primaryButton: {
    marginTop: 6,
    minHeight: 44,
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
    padding: 16,
    gap: 12,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardMuted: { opacity: 0.72 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 13 },
  tile: { width: 52, height: 52, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  tileText: { fontSize: 18, fontWeight: "700" },
  cardBody: { flex: 1, minWidth: 0, gap: 3 },
  serviceName: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
  technician: { fontSize: 14, color: Colors.textSecondary },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  whenWrap: { flex: 1, minWidth: 0, gap: 2 },
  when: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  venue: { fontSize: 13, color: Colors.textLight },
  price: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  bookAgain: { fontSize: 15, fontWeight: "700", color: Colors.primary },

  skel: { backgroundColor: "#ECECEF" },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: "#ECECEF" },
});
