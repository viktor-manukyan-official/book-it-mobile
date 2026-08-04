import { useState } from "react";
import { Alert, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../src/hooks/useAuth";

const PROFILE_MENU_ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "time-outline", label: "My History" },
  { icon: "language-outline", label: "Language Selection" },
  { icon: "help-circle-outline", label: "Help & Support" },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "";
  const initial = (user?.firstName?.[0] ?? "").toUpperCase();

  const confirmLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out of BookIt?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          try {
            // Clears the stored session; the root route guard then redirects
            // back to the phone-login screen.
            await signOut();
          } catch {
            setSigningOut(false);
            Alert.alert("Log out failed", "Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          {initial ? (
            <Text style={styles.avatarInitial}>{initial}</Text>
          ) : (
            <Ionicons name="person" size={48} color={Colors.white} />
          )}
        </View>
        <Text style={styles.name}>{fullName || "BookIt user"}</Text>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
      </View>

      <View style={styles.menuSection}>
        <View style={styles.menuCard}>
          {PROFILE_MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuRow,
                index < PROFILE_MENU_ITEMS.length - 1 && styles.menuRowBorder,
              ]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={styles.menuRowLeft}>
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={Colors.textPrimary}
                />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.7}
          onPress={confirmLogout}
          disabled={signingOut}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          accessibilityState={{ disabled: signingOut, busy: signingOut }}
        >
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          <Text style={styles.logoutLabel}>
            {signingOut ? "Logging out…" : "Log out"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 42,
    fontWeight: "700",
    color: Colors.white,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: 16,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  menuSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  menuCard: {
    borderRadius: 16,
    backgroundColor: Colors.card,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.card,
    minHeight: 44,
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.error,
  },
});
