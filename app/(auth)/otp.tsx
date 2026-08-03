import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { BackButton } from "../../src/components/BackButton";
import { GradientButton } from "../../src/components/GradientButton";
import { authenticateWithFirebase } from "../../src/services/authApi";
import {
  clearPendingConfirmation,
  confirmOtp,
  getPendingConfirmation,
  sendOtp,
  setPendingConfirmation,
} from "../../src/services/firebase";
import { GraphQLRequestError } from "../../src/services/graphqlClient";
import { useAuth } from "../../src/hooks/useAuth";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

// Render +37477123456 as "+374 77 123 456" for the "Sent to" line.
function formatPhone(e164: string): string {
  const match = /^(\+374)(\d{2})(\d{3})(\d{3})$/.exec(e164);
  if (!match) return e164;
  return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
}

export default function OtpScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ phone: string; isExistingUser: string }>();
  const phone = params.phone ?? "";
  const isExistingUser = params.isExistingUser === "1";

  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  // Resend countdown.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const displayPhone = useMemo(() => formatPhone(phone), [phone]);
  const canResend = secondsLeft <= 0 && !resending && !verifying;

  const restartFlow = () => {
    clearPendingConfirmation();
    router.replace("/(auth)/phone");
  };

  const onChangeCode = (value: string) => {
    setCode(value.replace(/\D/g, "").slice(0, CODE_LENGTH));
    if (error) setError(null);
  };

  const onConfirm = async () => {
    if (code.length < CODE_LENGTH) {
      setError("Enter the 6-digit code we sent you.");
      return;
    }
    const confirmation = getPendingConfirmation();
    if (!confirmation) {
      setError("Your session expired. Please request a new code.");
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      const idToken = await confirmOtp(confirmation, code);
      if (isExistingUser) {
        const payload = await authenticateWithFirebase({ idToken });
        clearPendingConfirmation();
        await signIn(
          {
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken,
          },
          payload.user,
        );
        router.replace("/(tabs)");
      } else {
        // New user — collect registration details, carrying the ID token.
        clearPendingConfirmation();
        router.replace({ pathname: "/(auth)/register", params: { idToken } });
      }
    } catch (err) {
      if (err instanceof GraphQLRequestError) {
        setError(`${err.message} Please request a new code.`);
      } else {
        setError("That code didn't work. Check it and try again, or resend.");
      }
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    if (!phone) {
      restartFlow();
      return;
    }
    setError(null);
    setResending(true);
    try {
      const confirmation = await sendOtp(phone);
      setPendingConfirmation(confirmation);
      setCode("");
      setSecondsLeft(RESEND_SECONDS);
    } catch {
      setError("We couldn't resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <BackButton onPress={restartFlow} />
        </View>

        <View style={styles.content}>
          <View style={styles.heading}>
            <Text style={styles.title}>Enter the{"\n"}6-digit code</Text>
            <Text style={styles.subtitle}>
              Sent to <Text style={styles.subtitleStrong}>{displayPhone}</Text>
            </Text>
          </View>

          {/* Segmented boxes are a visual layer over one hidden input. */}
          <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()}>
            {Array.from({ length: CODE_LENGTH }).map((_, i) => {
              const char = code[i];
              const active = i === code.length;
              return (
                <View
                  key={i}
                  style={[styles.box, (active || char) && styles.boxActive]}
                >
                  <Text style={styles.boxChar}>{char ?? ""}</Text>
                </View>
              );
            })}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={onChangeCode}
              keyboardType="number-pad"
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              maxLength={CODE_LENGTH}
              autoFocus
              editable={!verifying}
              accessibilityLabel="Verification code"
            />
          </Pressable>

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <View style={styles.footer}>
            <GradientButton
              label="Verify"
              onPress={onConfirm}
              loading={verifying}
              disabled={code.length < CODE_LENGTH}
              accessibilityLabel="Verify code"
            />
            <View style={styles.resendRow}>
              <Text style={styles.resendMuted}>Didn&apos;t get it? </Text>
              {canResend ? (
                <TouchableOpacity
                  onPress={onResend}
                  accessibilityRole="button"
                  accessibilityLabel="Resend code"
                >
                  <Text style={styles.resendLink}>
                    {resending ? "Resending…" : "Resend code"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendCountdown}>
                  Resend in 0:{String(Math.max(secondsLeft, 0)).padStart(2, "0")}
                </Text>
              )}
            </View>
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
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20, gap: 32 },
  heading: { gap: 10 },
  title: {
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 34,
    color: Colors.textPrimary,
  },
  subtitle: { fontSize: 15, lineHeight: 22, color: Colors.textSecondary },
  subtitleStrong: { fontWeight: "600", color: Colors.textPrimary },
  boxes: { flexDirection: "row", gap: 9 },
  box: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: { borderWidth: 1.5, borderColor: Colors.primary },
  boxChar: { fontSize: 24, fontWeight: "600", color: Colors.textPrimary },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  error: { color: Colors.error, fontSize: 14 },
  footer: { gap: 18 },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resendMuted: { fontSize: 14, color: Colors.textSecondary },
  resendLink: { fontSize: 14, fontWeight: "600", color: Colors.primary },
  resendCountdown: { fontSize: 14, color: Colors.textLight },
});
