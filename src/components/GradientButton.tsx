import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Colors, PrimaryGradient } from "../../constants/colors";

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The app's signature primary CTA: a full-pill coral -> peach gradient button
 * (design brief §2). Disabled/loading states dim the gradient rather than
 * swapping to a flat colour, so the signature stays recognizable.
 */
export function GradientButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
}: GradientButtonProps) {
  const isInactive = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={style}
    >
      <LinearGradient
        colors={PrimaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, isInactive && styles.inactive]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <View>
            <Text style={styles.label}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    // Soft coral glow beneath the CTA (shadow approximates the mockup's
    // 0 12px 26px rgba(255,107,107,.3)).
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 13,
    elevation: 6,
  },
  inactive: { opacity: 0.45 },
  label: { color: Colors.white, fontSize: 17, fontWeight: "600" },
});
