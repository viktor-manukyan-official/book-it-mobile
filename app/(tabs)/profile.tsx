import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { PROFILE_MENU_ITEMS } from "../../data/mock";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color={Colors.white} />
        </View>
        <Text style={styles.name}>Anna Hakobyan</Text>
        <Text style={styles.email}>anna.hakobyan@email.com</Text>
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
});
