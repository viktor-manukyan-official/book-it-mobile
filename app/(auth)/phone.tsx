import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ArmeniaFlag, Colors } from "../../constants/colors";
import { BackButton } from "../../src/components/BackButton";
import { GradientButton } from "../../src/components/GradientButton";
import { userExists } from "../../src/services/authApi";
import { GraphQLRequestError } from "../../src/services/graphqlClient";
import { sendOtp, setPendingConfirmation } from "../../src/services/firebase";

// Armenia country code is fixed for this app.
const COUNTRY_CODE = "+374";
// Armenian subscriber numbers are 8 digits (e.g. 77 123 456).
const LOCAL_DIGITS = 8;

// Present the raw digits as "77 123 456" to match the mockup.
function formatLocal(digits: string): string {
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8)];
  return groups.filter(Boolean).join(" ");
}

export default function PhoneEntryScreen() {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const e164 = `${COUNTRY_CODE}${digits}`;

  const onChange = (value: string) => {
    setDigits(value.replace(/\D/g, "").slice(0, LOCAL_DIGITS));
    if (error) setError(null);
  };

  const onSubmit = async () => {
    if (digits.length !== LOCAL_DIGITS) {
      setError("Enter your 8-digit Armenian phone number.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const exists = await userExists(e164);
      const confirmation = await sendOtp(e164);
      setPendingConfirmation(confirmation);
      router.push({
        pathname: "/(auth)/otp",
        params: { phone: e164, isExistingUser: exists ? "1" : "0" },
      });
    } catch (err) {
      if (err instanceof GraphQLRequestError) {
        setError(err.message);
      } else {
        setError("We could not send the code. Check the number and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          {/* `phone` is the auth entry route (reached via router.replace), so
              there is usually no history to pop. Only show Back when we can. */}
          {router.canGoBack() ? <BackButton onPress={() => router.back()} /> : null}
        </View>

        <View style={styles.content}>
          <View style={styles.heading}>
            <Text style={styles.title}>Enter your{"\n"}phone number</Text>
            <Text style={styles.subtitle}>
              We&apos;ll text you a 6-digit code. No password needed.
            </Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.codePill}>
              <View style={styles.flag}>
                {ArmeniaFlag.map((stripe) => (
                  <View key={stripe} style={[styles.flagStripe, { backgroundColor: stripe }]} />
                ))}
              </View>
              <Text style={styles.codeText}>{COUNTRY_CODE}</Text>
            </View>

            <TextInput
              style={[styles.input, digits.length > 0 && styles.inputActive]}
              value={formatLocal(digits)}
              onChangeText={onChange}
              keyboardType="phone-pad"
              autoComplete="tel"
              autoFocus
              placeholder="77 123 456"
              placeholderTextColor={Colors.textLight}
              editable={!submitting}
              accessibilityLabel="Phone number"
            />
          </View>

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <View style={styles.footer}>
            <GradientButton
              label="Send code"
              onPress={onSubmit}
              loading={submitting}
              disabled={digits.length !== LOCAL_DIGITS}
              accessibilityLabel="Send verification code"
            />
            <Text style={styles.privacy}>
              Standard SMS rates may apply. Your number is never shown to providers.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: { height: 52, justifyContent: "center", paddingHorizontal: 20 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20, gap: 30 },
  heading: { gap: 10 },
  title: {
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 34,
    color: Colors.textPrimary,
  },
  subtitle: { fontSize: 15, lineHeight: 22, color: Colors.textSecondary },
  inputRow: { flexDirection: "row", gap: 10 },
  codePill: {
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  flag: {
    width: 26,
    height: 18,
    borderRadius: 3,
    overflow: "hidden",
  },
  flagStripe: { flex: 1 },
  codeText: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  input: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
    color: Colors.textPrimary,
  },
  inputActive: { borderWidth: 1.5, borderColor: Colors.primary },
  error: { color: Colors.error, fontSize: 14 },
  footer: { gap: 14 },
  privacy: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textLight,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
