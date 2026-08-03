import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";

import { Colors } from "../../constants/colors";

interface BackButtonProps {
  onPress: () => void;
}

/**
 * White rounded-square back affordance used in the auth flow headers
 * (design brief §3.2/§3.3 — a 40x40 floating card with a chevron).
 */
export function BackButton({ onPress }: BackButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={styles.button}
    >
      <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
