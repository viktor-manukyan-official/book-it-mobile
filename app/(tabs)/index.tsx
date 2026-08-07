import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";
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
    primaries,
    primaryIdOf,
    selectedPrimaryId,
    selectPrimary,
    subcategories,
    subcategoriesOf,
    subCount,
    selectedSubId,
    selectSub,
    filteredServices,
    groupLabel,
    hasServices,
    totalServiceCount,
    filterSubIds,
    filterActive,
    applyFilter,
    clearFilter,
    notify,
    registerNotify,
    refresh,
    retry,
  } = useHomeVenue();
  const [primaryPickerOpen, setPrimaryPickerOpen] = useState(false);

  // Home shows at most 2 primary chips + the Filter chip. When a filter is
  // active, those two are the primaries of the selected subcategories (in
  // selection order); otherwise the selected primary first, then the rest.
  const shownPrimaries = (() => {
    if (filterActive) {
      const ids: string[] = [];
      for (const subId of filterSubIds) {
        const pid = primaryIdOf(subId);
        if (pid && !ids.includes(pid)) ids.push(pid);
      }
      const list = ids
        .map((id) => primaries.find((p) => p.id === id))
        .filter((p): p is (typeof primaries)[number] => !!p);
      if (list.length > 0) return list.slice(0, 2);
    }
    const sel = primaries.find((p) => p.id === selectedPrimaryId);
    const rest = primaries.filter((p) => p.id !== selectedPrimaryId);
    return (sel ? [sel, ...rest] : rest).slice(0, 2);
  })();

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
                {/* Primary categories + "All N" picker */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                  style={styles.chipsScroll}
                >
                  {shownPrimaries.map((p) => {
                    const on = !filterActive && selectedPrimaryId === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.chip, on ? styles.chipActive : styles.chipInactive]}
                        onPress={() => selectPrimary(p.id)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={p.name}
                      >
                        <Text style={on ? styles.chipTextActive : styles.chipTextInactive} numberOfLines={1}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.filterChip, filterActive ? styles.chipActive : styles.chipInactive]}
                    onPress={() => setPrimaryPickerOpen(true)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      filterActive ? `Filters, ${filterSubIds.length} selected` : "Filters"
                    }
                  >
                    <Ionicons
                      name="options-outline"
                      size={22}
                      color={filterActive ? Colors.white : Colors.textSecondary}
                    />
                    {filterActive ? (
                      <Text style={styles.filterChipCount}>{filterSubIds.length}</Text>
                    ) : null}
                  </TouchableOpacity>
                </ScrollView>

                {/* Subcategories of the selected primary (All + children) */}
                {subcategories.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsRow}
                    style={styles.subChipsScroll}
                  >
                    {[{ id: null, name: "All" }, ...subcategories].map((c) => {
                      const on = selectedSubId === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id ?? "all"}
                          style={[styles.subChip, on ? styles.subChipActive : styles.subChipInactive]}
                          onPress={() => selectSub(c.id)}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                          accessibilityLabel={c.name}
                        >
                          <Text style={on ? styles.subChipTextActive : styles.subChipTextInactive}>
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : null}

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

      {/* Multi-select category filter */}
      <FilterSheet
        visible={primaryPickerOpen}
        primaries={primaries}
        subcategoriesOf={subcategoriesOf}
        subCount={subCount}
        totalServiceCount={totalServiceCount}
        initialSelected={filterSubIds}
        onClose={() => setPrimaryPickerOpen(false)}
        onApply={(ids) => {
          if (ids.length > 0) applyFilter(ids);
          else clearFilter();
          setPrimaryPickerOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

/** Multi-select category filter sheet: accordion per primary, checkboxes with
 *  counts, removable selected pills, Reset, and a live "Show N services" CTA. */
function FilterSheet({
  visible,
  primaries,
  subcategoriesOf,
  subCount,
  totalServiceCount,
  initialSelected,
  onClose,
  onApply,
}: {
  visible: boolean;
  primaries: { id: string; name: string }[];
  subcategoriesOf: (id: string | null) => { id: string; name: string }[];
  subCount: (id: string) => number;
  totalServiceCount: number;
  initialSelected: string[];
  onClose: () => void;
  onApply: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [expanded, setExpanded] = useState<string[]>(() =>
    primaries.slice(0, 2).map((p) => p.id),
  );
  // Re-seed the draft when the sheet is (re)opened with a new applied filter.
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setSelected(initialSelected), 0);
    return () => clearTimeout(t);
  }, [visible, initialSelected]);

  const subById = useMemo(() => {
    const m = new Map<string, { id: string; name: string }>();
    for (const p of primaries) for (const s of subcategoriesOf(p.id)) m.set(s.id, s);
    return m;
  }, [primaries, subcategoriesOf]);

  const toggleSub = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const toggleExpand = (id: string) =>
    setExpanded((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const showCount = selected.length
    ? selected.reduce((n, id) => n + subCount(id), 0)
    : totalServiceCount;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grabber} />
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>Filter</Text>
            <TouchableOpacity onPress={() => setSelected([])} hitSlop={8} accessibilityRole="button">
              <Text style={styles.sheetClose}>Reset</Text>
            </TouchableOpacity>
          </View>

          {selected.length > 0 ? (
            <View style={styles.selectedPills}>
              {selected.map((id) => {
                const s = subById.get(id);
                if (!s) return null;
                return (
                  <TouchableOpacity
                    key={id}
                    style={styles.selectedPill}
                    onPress={() => toggleSub(id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${s.name}`}
                  >
                    <Text style={styles.selectedPillText}>{s.name}</Text>
                    <Ionicons name="close" size={13} color={Colors.white} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterBody}>
            {primaries.map((p) => {
              const subs = subcategoriesOf(p.id);
              if (subs.length === 0) return null;
              const isOpen = expanded.includes(p.id);
              const selCount = subs.filter((s) => selected.includes(s.id)).length;
              return (
                <View key={p.id} style={styles.accordion}>
                  <TouchableOpacity
                    style={styles.accordionHead}
                    onPress={() => toggleExpand(p.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                  >
                    <Text style={styles.accordionTitle}>{p.name}</Text>
                    <Text style={styles.accordionMeta}>
                      {selCount} of {subs.length} selected
                    </Text>
                    <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={Colors.textLight} />
                  </TouchableOpacity>
                  {isOpen
                    ? subs.map((s) => {
                        const on = selected.includes(s.id);
                        return (
                          <TouchableOpacity
                            key={s.id}
                            style={styles.checkRow}
                            onPress={() => toggleSub(s.id)}
                            activeOpacity={0.7}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: on }}
                          >
                            <View style={[styles.checkbox, on && styles.checkboxOn]}>
                              {on ? <Ionicons name="checkmark" size={13} color={Colors.white} /> : null}
                            </View>
                            <Text style={styles.checkLabel}>{s.name}</Text>
                            <Text style={styles.checkCount}>{subCount(s.id)}</Text>
                          </TouchableOpacity>
                        );
                      })
                    : null}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.filterFooter}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => onApply(selected)}>
              <LinearGradient
                colors={PrimaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.showButton}
              >
                <Text style={styles.showButtonText}>
                  Show {showCount} {showCount === 1 ? "service" : "services"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
  filterChip: {
    height: 44,
    borderRadius: 999,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterChipCount: { fontSize: 15, fontWeight: "700", color: Colors.white },
  chipTextActive: { fontSize: 13, fontWeight: "500", color: Colors.white },
  chipTextInactive: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },

  subChipsScroll: { flexGrow: 0, marginHorizontal: -20, marginTop: 8 },
  subChip: { height: 34, borderRadius: 999, paddingHorizontal: 14, justifyContent: "center" },
  subChipActive: { backgroundColor: "#FBD9D6" },
  subChipInactive: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  subChipTextActive: { fontSize: 13, fontWeight: "600", color: "#C2554F" },
  subChipTextInactive: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    maxHeight: "82%",
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 999, backgroundColor: Colors.border, marginBottom: 10 },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  sheetTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5, color: Colors.textPrimary },
  sheetClose: { fontSize: 16, fontWeight: "600", color: Colors.primary },

  selectedPills: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, paddingTop: 14 },
  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: Colors.textPrimary,
  },
  selectedPillText: { fontSize: 13, fontWeight: "600", color: Colors.white },

  filterBody: { padding: 20, paddingTop: 14, gap: 12 },
  accordion: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accordionHead: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10 },
  accordionTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  accordionMeta: { fontSize: 13, color: Colors.textLight },
  checkRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  checkCount: { fontSize: 14, fontWeight: "600", color: Colors.textLight },

  filterFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  showButton: { height: 54, borderRadius: 999, justifyContent: "center", alignItems: "center" },
  showButtonText: { fontSize: 16, fontWeight: "700", color: Colors.white },

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
