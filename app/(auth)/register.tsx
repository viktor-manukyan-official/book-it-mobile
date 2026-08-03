import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { GradientButton } from "../../src/components/GradientButton";
import { authenticateWithFirebase } from "../../src/services/authApi";
import { GraphQLRequestError } from "../../src/services/graphqlClient";
import { useAuth } from "../../src/hooks/useAuth";
import type { Gender } from "../../src/types/auth";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Displayed in the mockup's order (Female / Male / Other).
const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ idToken: string }>();
  const idToken = params.idToken ?? "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setEmailError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!EMAIL.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (!idToken) {
      setError("Your session expired. Please start again.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = await authenticateWithFirebase({
        idToken,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        gender: gender ?? undefined,
      });
      await signIn(
        {
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        },
        payload.user,
      );
      router.replace("/(tabs)");
    } catch (err) {
      if (err instanceof GraphQLRequestError) {
        if (/email already in use/i.test(err.message)) {
          setEmailError("This email is already in use.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heading}>
            <View style={styles.badge}>
              <Text style={styles.badgeGlyph}>✦</Text>
            </View>
            <Text style={styles.title}>Welcome to BookIt</Text>
            <Text style={styles.subtitle}>
              Just a few details, then you&apos;re booking.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Text style={styles.label}>First name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Ani"
                  placeholderTextColor={Colors.textLight}
                  editable={!submitting}
                  accessibilityLabel="First name"
                />
              </View>
              <View style={styles.nameField}>
                <Text style={styles.label}>Last name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Petrosyan"
                  placeholderTextColor={Colors.textLight}
                  editable={!submitting}
                  accessibilityLabel="Last name"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailFocused && styles.inputActive]}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="ani.petrosyan@gmail.com"
                placeholderTextColor={Colors.textLight}
                editable={!submitting}
                accessibilityLabel="Email"
              />
              {emailError ? (
                <Text style={styles.error} accessibilityRole="alert">
                  {emailError}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Gender <Text style={styles.labelMuted}>· optional</Text>
              </Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map(({ value, label }) => {
                  const selected = gender === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.genderChip, selected && styles.genderChipSelected]}
                      onPress={() => setGender(selected ? null : value)}
                      disabled={submitting}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={[styles.genderText, selected && styles.genderTextSelected]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
          </View>

          <View style={styles.footer}>
            <GradientButton
              label="Create account"
              onPress={onSubmit}
              loading={submitting}
              accessibilityLabel="Create account"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 30, gap: 26 },
  heading: { gap: 10 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#FFE3D5",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeGlyph: { fontSize: 22, fontWeight: "700", color: Colors.primary },
  title: {
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 34,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  subtitle: { fontSize: 15, lineHeight: 22, color: Colors.textSecondary },
  form: { gap: 16 },
  nameRow: { flexDirection: "row", gap: 10 },
  nameField: { flex: 1, gap: 7 },
  field: { gap: 7 },
  label: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  labelMuted: { color: Colors.textLight, fontWeight: "400" },
  input: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  inputActive: { borderWidth: 1.5, borderColor: Colors.primary },
  genderRow: { flexDirection: "row", gap: 8 },
  genderChip: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  genderChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#FFF1F1",
  },
  genderText: { fontSize: 15, fontWeight: "500", color: Colors.textSecondary },
  genderTextSelected: { color: Colors.primary, fontWeight: "600" },
  error: { color: Colors.error, fontSize: 14 },
  footer: { marginTop: 4 },
});
