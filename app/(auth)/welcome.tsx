import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";
import { GradientButton } from "../../src/components/GradientButton";

/**
 * First-run landing / hero screen (design brief §2). Warm off-white canvas with
 * two soft coral blobs, the BookIt mark, value proposition, and the single
 * primary CTA that starts phone-based auth. This is the auth entry route, so it
 * `push`es to the phone screen (giving that screen a working Back).
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Decorative background blobs — top-right peach and one behind the logo. */}
      <LinearGradient
        colors={["#FBD5C4", "#FDE6DC"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.blobTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["#FCE3D6", "#FFF8F5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.blobLogo}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <View style={styles.hero}>
          <LinearGradient
            colors={PrimaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logo}
          >
            <Text style={styles.logoGlyph}>B</Text>
          </LinearGradient>

          <Text style={styles.title}>BookIt</Text>
          <Text style={styles.subtitle}>
            Book beauty & wellness, instantly. Pay at the venue.
          </Text>
        </View>

        <View style={styles.footer}>
          <GradientButton
            label="Continue with phone"
            onPress={() => router.push("/(auth)/phone")}
            accessibilityLabel="Continue with phone"
          />
          <Text style={styles.legal}>
            By continuing you agree to our{" "}
            <Text
              style={styles.legalLink}
              onPress={() => router.push("/legal/terms")}
              accessibilityRole="link"
            >
              Terms
            </Text>{" "}
            and{" "}
            <Text
              style={styles.legalLink}
              onPress={() => router.push("/legal/privacy")}
              accessibilityRole="link"
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvasWarm },
  blobTop: {
    position: "absolute",
    top: -160,
    right: -120,
    width: 420,
    height: 420,
    borderRadius: 210,
    opacity: 0.9,
  },
  blobLogo: {
    position: "absolute",
    bottom: 220,
    left: -110,
    width: 360,
    height: 360,
    borderRadius: 180,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: "flex-end",
  },
  hero: { flex: 1, justifyContent: "center", gap: 18 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  logoGlyph: { fontSize: 42, fontWeight: "700", color: Colors.white },
  title: {
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 19,
    lineHeight: 27,
    color: Colors.textSecondary,
    maxWidth: 320,
  },
  footer: { gap: 16 },
  legal: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textLight,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  legalLink: { color: Colors.textSecondary, fontWeight: "600" },
});
