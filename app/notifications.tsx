import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../constants/colors";
import { useNotifications } from "../src/hooks/useNotifications";
import type { AppNotification } from "../src/types/catalog";

type Tab = "all" | "unread" | "appointments" | "offers";

const VISUAL: Record<string, { icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }> = {
  appointment_completed: { icon: "star", bg: "#FBD9D6", fg: "#C2554F" },
  appointment_confirmed: { icon: "checkmark", bg: "#D6E4FB", fg: "#3F5FB4" },
  appointment_created: { icon: "calendar", bg: "#FBD9D6", fg: "#C2554F" },
  appointment_cancelled: { icon: "close", bg: "#ECECEF", fg: "#6B7280" },
  promotion: { icon: "pricetag", bg: "#FBE5C8", fg: "#8A5A12" },
};
const DEFAULT_VISUAL = { icon: "notifications" as const, bg: "#ECECEF", fg: "#6B7280" };

function timeAgo(iso: string, now: number): string {
  if (!now) return "";
  const diff = now - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
}

function NotificationCard({
  n,
  now,
  onOpen,
}: {
  n: AppNotification;
  now: number;
  onOpen: () => void;
}) {
  const v = VISUAL[n.type] ?? DEFAULT_VISUAL;
  const isCompleted = n.type === "appointment_completed";
  return (
    <TouchableOpacity
      style={[styles.card, n.read && styles.cardRead]}
      activeOpacity={0.85}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={n.title}
    >
      <View style={[styles.icon, { backgroundColor: v.bg }]}>
        <Ionicons name={v.icon} size={18} color={v.fg} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {n.title}
          </Text>
          {!n.read ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.text} numberOfLines={2}>
          {n.body}
        </Text>
        <View style={styles.metaRow}>
          {isCompleted ? (
            <TouchableOpacity style={styles.rateButton} onPress={onOpen} hitSlop={6}>
              <Text style={styles.rateText}>Rate visit</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.time}>{timeAgo(n.createdAt, now)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { items, unread, loading, loadingMore, refreshing, error, loadMore, markRead, markAll, refresh, retry } =
    useNotifications();
  const [tab, setTab] = useState<Tab>("all");
  const [now, setNow] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    switch (tab) {
      case "unread":
        return items.filter((n) => !n.read);
      case "appointments":
        return items.filter((n) => n.type.startsWith("appointment"));
      case "offers":
        return items.filter((n) => n.type === "promotion");
      default:
        return items;
    }
  }, [items, tab]);

  const onOpen = (n: AppNotification) => {
    markRead(n.id);
    const apptId = n.data?.appointmentId;
    if (n.type === "appointment_completed" && apptId) {
      router.push({ pathname: "/booking/rate", params: { id: apptId } });
    } else if (apptId) {
      router.push({ pathname: "/booking/details", params: { id: apptId } });
    }
  };

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread", badge: unread },
    { key: "appointments", label: "Appointments" },
    { key: "offers", label: "Offers" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAll} hitSlop={8} accessibilityRole="button" accessibilityLabel="Mark all read">
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
      >
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, on ? styles.tabOn : styles.tabOff]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={on ? styles.tabTextOn : styles.tabTextOff}>{t.label}</Text>
              {t.badge ? (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{t.badge}</Text>
                </View>
              ) : null}
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
          <TouchableOpacity style={styles.primaryButton} onPress={retry}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-outline" size={34} color={Colors.primary} />
          </View>
          <Text style={styles.emptyHeading}>You&apos;re all caught up</Text>
          <Text style={styles.dimText}>
            Booking updates, reminders and offers from your venues will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NotificationCard n={item} now={now} onOpen={() => onOpen(item)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
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
  screenTitle: { flex: 1, fontSize: 22, fontWeight: "700", letterSpacing: -0.4, color: Colors.textPrimary },
  markAll: { fontSize: 14, fontWeight: "600", color: Colors.primary },

  tabsScroll: { flexGrow: 0 },
  tabsRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  tab: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  tabOn: { backgroundColor: Colors.textPrimary },
  tabOff: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabTextOn: { fontSize: 14, fontWeight: "600", color: Colors.white },
  tabTextOff: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  tabBadge: { minWidth: 20, height: 20, borderRadius: 999, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  tabBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.white },

  list: { padding: 16, gap: 12 },
  footer: { paddingVertical: 16, alignItems: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 12 },
  dimText: { fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  primaryButton: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { fontSize: 15, fontWeight: "600", color: Colors.white },

  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: "#FCE3DD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyHeading: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },

  card: {
    flexDirection: "row",
    gap: 13,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardRead: { opacity: 0.7 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: Colors.primary, marginTop: 5 },
  text: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  rateButton: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  rateText: { fontSize: 13, fontWeight: "700", color: Colors.white },
  time: { fontSize: 12, color: Colors.textLight },
});
