import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";
import { useServiceDetail } from "../../src/hooks/useServiceDetail";
import type { ServiceDetail } from "../../src/types/catalog";

const money = (amount: number) => `${amount.toLocaleString("en-US")} ֏`;

// Category-derived hero gradients (fallback when a service has no image).
const HERO_GRADIENTS: [string, string, string][] = [
  ["#FFB88C", "#FF7E6B", "#FF6B6B"],
  ["#C9E8D8", "#9FD6BC", "#7FC3A3"],
  ["#D7E7FF", "#AEC2EE", "#8FA9E6"],
  ["#EEDBF6", "#E0C3F0", "#C9A5E4"],
  ["#FCE7C4", "#F6D79A", "#EBC072"],
];

function heroGradient(key: string | null | undefined): [string, string, string] {
  if (!key) return HERO_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return HERO_GRADIENTS[hash % HERO_GRADIENTS.length];
}

function cancellationText(s: ServiceDetail): string {
  const window = `Free cancellation up to ${s.freeCancelMinutes} min before your slot.`;
  if (!s.cancellationFee || s.cancellationFee <= 0) return window;
  const fee =
    s.cancellationFeeType === "percentage"
      ? `${s.cancellationFee}%`
      : money(s.cancellationFee);
  return `${window} After that a ${fee} fee may apply.`;
}

export default function ServiceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { service, loading, error, notFound, retry } = useServiceDetail(id);
  const [descExpanded, setDescExpanded] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const BackButton = (
    <TouchableOpacity
      style={styles.circleButton}
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
    >
      <Ionicons name="chevron-back" size={22} color="#8A3B32" />
    </TouchableOpacity>
  );

  // Not-found (removed / deactivated service) — full-screen state.
  if (notFound) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.notFoundHeading}>Service not found</Text>
        <Text style={styles.dimText}>
          This service is no longer available. It may have been removed by the venue.
        </Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={goBack}>
          <Text style={styles.secondaryButtonText}>Back to venue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    const g = heroGradient(id);
    return (
      <View style={styles.container}>
        <LinearGradient colors={g} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <View style={styles.heroTopRow}>{BackButton}</View>
        </LinearGradient>
        <View style={styles.factsRow}>
          <View style={[styles.factCard, styles.skel]} />
          <View style={[styles.factCard, styles.skel]} />
        </View>
        <View style={styles.body}>
          <View style={[styles.skelLine, { width: "50%", height: 18 }]} />
          <View style={[styles.skelLine, { width: "90%" }]} />
          <View style={[styles.skelLine, { width: "80%" }]} />
        </View>
      </View>
    );
  }

  if (error || !service) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.dimText}>{error ?? "Something went wrong."}</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={retry}>
          <Text style={styles.secondaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const g = heroGradient(service.categoryName);
  const showReadMore = (service.description?.length ?? 0) > 160;

  const chooseTime = () =>
    router.push({
      pathname: "/booking/time",
      params: {
        serviceId: service.id,
        name: service.name,
        duration: String(service.duration),
        price: String(service.price),
      },
    });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Hero */}
        <LinearGradient colors={g} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <View style={styles.heroTopRow}>{BackButton}</View>
          <Text style={styles.heroPlaceholder}>SERVICE PHOTO PLACEHOLDER</Text>
          <View style={styles.heroBottom}>
            <View style={styles.pillRow}>
              {service.categoryName ? (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{service.categoryName}</Text>
                </View>
              ) : null}
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  {service.rating != null
                    ? `★ ${service.rating.toFixed(1)}${
                        service.reviewCount != null ? ` · ${service.reviewCount}` : ""
                      }`
                    : "New"}
                </Text>
              </View>
            </View>
            <Text style={styles.serviceName} numberOfLines={2}>
              {service.name}
            </Text>
          </View>
        </LinearGradient>

        {/* Key facts */}
        <View style={styles.factsRow}>
          <View style={styles.factCard}>
            <Text style={styles.factLabel}>Duration</Text>
            <Text style={styles.factValue}>{service.duration} min</Text>
          </View>
          <View style={styles.factCard}>
            <Text style={styles.factLabel}>Price</Text>
            <Text style={styles.factValue}>{money(service.price)}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* About */}
          {service.description ? (
            <View style={styles.aboutBlock}>
              <Text style={styles.sectionHeading}>About this service</Text>
              <Text
                style={styles.aboutText}
                numberOfLines={descExpanded ? undefined : 4}
              >
                {service.description}
              </Text>
              {showReadMore ? (
                <TouchableOpacity onPress={() => setDescExpanded((v) => !v)} hitSlop={8}>
                  <Text style={styles.readMore}>{descExpanded ? "Read less" : "Read more"}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Technician choice */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons
                name={service.customerCanSelectTechnician ? "checkmark" : "person"}
                size={18}
                color={Colors.primary}
              />
            </View>
            <View style={styles.infoBody}>
              {service.customerCanSelectTechnician ? (
                <>
                  <Text style={styles.infoTitle}>You can choose your technician</Text>
                  <Text style={styles.infoSub}>Or let us assign the next available</Text>
                </>
              ) : (
                <>
                  <Text style={styles.infoTitle}>The venue assigns your technician</Text>
                  <Text style={styles.infoSub}>Handled automatically for this service</Text>
                </>
              )}
            </View>
          </View>

          {/* Cancellation policy */}
          <View style={styles.infoCard}>
            <View style={[styles.dot, { backgroundColor: Colors.star }]} />
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>Cancellation policy</Text>
              <Text style={styles.infoSub}>{cancellationText(service)}</Text>
            </View>
          </View>

          {/* Pay at venue */}
          <View style={styles.payRow}>
            <View style={[styles.dot, { backgroundColor: Colors.textLight }]} />
            <Text style={styles.payText}>Pay at the venue — no card needed to book.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={chooseTime}
          accessibilityRole="button"
          accessibilityLabel="Choose a time"
        >
          <LinearGradient
            colors={PrimaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Choose a time</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: "center", alignItems: "center", padding: 24, gap: 14 },
  dimText: { fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  notFoundHeading: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },

  hero: { minHeight: 300, paddingHorizontal: 20, paddingBottom: 20, justifyContent: "space-between" },
  heroTopRow: { flexDirection: "row" },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPlaceholder: {
    textAlign: "center",
    letterSpacing: 3,
    fontSize: 12,
    color: "rgba(255,255,255,.7)",
  },
  heroBottom: { gap: 12 },
  pillRow: { flexDirection: "row", gap: 8 },
  pill: {
    backgroundColor: "rgba(255,255,255,.85)",
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 34,
    justifyContent: "center",
  },
  pillText: { fontSize: 13, fontWeight: "600", color: "#8A3B32" },
  serviceName: { fontSize: 30, fontWeight: "800", letterSpacing: -0.6, color: "#2B1512" },

  factsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 20 },
  factCard: {
    flex: 1,
    minHeight: 74,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  factLabel: { fontSize: 13, color: Colors.textLight },
  factValue: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },

  body: { paddingHorizontal: 20, paddingTop: 22, gap: 18 },
  aboutBlock: { gap: 8 },
  sectionHeading: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  aboutText: { fontSize: 15, lineHeight: 24, color: Colors.textSecondary },
  readMore: { fontSize: 14, fontWeight: "600", color: Colors.primary },

  infoCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "flex-start",
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#FCE3DD",
    alignItems: "center",
    justifyContent: "center",
  },
  infoBody: { flex: 1, gap: 3 },
  infoTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  infoSub: { fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 999, marginTop: 6 },

  payRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 2 },
  payText: { fontSize: 13, color: Colors.textLight },

  actionBar: {
    backgroundColor: Colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  cta: { height: 54, borderRadius: 999, justifyContent: "center", alignItems: "center" },
  ctaText: { fontSize: 16, fontWeight: "700", color: Colors.white },

  secondaryButton: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: "600", color: Colors.white },

  skel: { backgroundColor: "#ECECEF" },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: "#ECECEF" },
});
