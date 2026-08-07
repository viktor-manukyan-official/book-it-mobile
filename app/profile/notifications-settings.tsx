import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "../../src/services/profileApi";

type Key = keyof NotificationPreferences;

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    let active = true;
    void fetchNotificationPreferences()
      .then((p) => active && setPrefs(p))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const toggle = (key: Key, value: boolean) => {
    setPrefs((p) => (p ? { ...p, [key]: value } : p)); // optimistic
    void updateNotificationPreferences({ [key]: value }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {!prefs ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.section}>BOOKINGS</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Booking confirmations"
              sub="When the provider confirms"
              value={prefs.bookingConfirmations}
              onValueChange={(v) => toggle("bookingConfirmations", v)}
            />
            <Divider />
            <ToggleRow
              label="Reminders"
              sub="2 hours before your visit"
              value={prefs.reminders}
              onValueChange={(v) => toggle("reminders", v)}
            />
            <Divider />
            <ToggleRow
              label="Changes & cancellations"
              sub="If the venue reschedules"
              value={prefs.changes}
              onValueChange={(v) => toggle("changes", v)}
            />
          </View>

          <Text style={styles.section}>CHANNELS</Text>
          <View style={styles.card}>
            <ToggleRow label="Push notifications" value={prefs.push} onValueChange={(v) => toggle("push", v)} />
            <Divider />
            <ToggleRow label="SMS" value={prefs.sms} onValueChange={(v) => toggle("sms", v)} />
          </View>
          <Text style={styles.hint}>
            SMS is used as fallback when push is unavailable. Booking-critical alerts are always
            delivered.
          </Text>

          <Text style={styles.section}>OFFERS</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Promotions from venues"
              value={prefs.promotions}
              onValueChange={(v) => toggle("promotions", v)}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onValueChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: Colors.primary, false: "#E5E7EB" }}
        thumbColor={Colors.white}
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
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
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.4, color: Colors.textPrimary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  body: { padding: 20, gap: 10 },
  section: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6, color: Colors.textLight, marginTop: 10 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: { minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 8 },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  rowSub: { fontSize: 13, color: Colors.textLight },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  hint: { fontSize: 13, color: Colors.textLight, lineHeight: 19, paddingHorizontal: 4 },
});
