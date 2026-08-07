import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";
import { useAuth } from "../../src/hooks/useAuth";
import { getLanguage, LANGUAGES, type LanguageCode } from "../../src/services/language";
import { fetchNotificationPreferences } from "../../src/services/profileApi";

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [lang, setLang] = useState<LanguageCode>("en");
  const [channels, setChannels] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getLanguage().then((l) => active && setLang(l));
      void fetchNotificationPreferences()
        .then((p) => {
          if (!active) return;
          const on = [p.push && "Push", p.sms && "SMS"].filter(Boolean);
          setChannels(on.length ? on.join(" + ") : "Off");
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
  const langLabel = LANGUAGES.find((l) => l.code === lang)?.label ?? "English";

  const onLogout = () =>
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void signOut() },
    ]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={styles.identity}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={PrimaryGradient} style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(fullName || "?")}</Text>
            </LinearGradient>
          )}
          <Text style={styles.name}>{fullName}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        </View>

        {/* Menu */}
        <View style={styles.card}>
          <Row
            icon="person-circle-outline"
            label="Personal info"
            onPress={() => router.push("/profile/personal")}
          />
          <Divider />
          <Row
            icon="language-outline"
            label="Language"
            value={langLabel}
            onPress={() => router.push("/profile/language")}
          />
          <Divider />
          <Row
            icon="notifications-outline"
            label="Notifications"
            value={channels}
            onPress={() => router.push("/profile/notifications-settings")}
          />
          <Divider />
          <Row
            icon="help-circle-outline"
            label="Help & support"
            onPress={() => router.push("/profile/help")}
          />
        </View>

        {/* Log out */}
        <TouchableOpacity style={styles.logoutCard} onPress={onLogout} accessibilityRole="button" accessibilityLabel="Log out">
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>BookIt v1.0 · Yerevan, Armenia</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={Colors.textSecondary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color="#C8C8CF" />
    </TouchableOpacity>
  );
}

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  body: { padding: 20, paddingTop: 24, gap: 20 },
  identity: { alignItems: "center", gap: 6 },
  avatar: { width: 116, height: 116, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 40, fontWeight: "800", color: Colors.white },
  name: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5, color: Colors.textPrimary, marginTop: 6 },
  email: { fontSize: 15, color: Colors.textSecondary },

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
  row: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 13 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  rowValue: { fontSize: 14, color: Colors.textLight, maxWidth: 140 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 49 },

  logoutCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  logoutText: { fontSize: 16, fontWeight: "700", color: Colors.error },
  footer: { fontSize: 13, color: Colors.textLight, textAlign: "center" },
});
