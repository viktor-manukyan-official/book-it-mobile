import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";
import { useAuth } from "../../src/hooks/useAuth";
import { updateProfile } from "../../src/services/profileApi";

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);

  const dirty =
    firstName.trim() !== (user?.firstName ?? "") ||
    lastName.trim() !== (user?.lastName ?? "") ||
    email.trim() !== (user?.email ?? "");
  const valid = firstName.trim().length > 0 && lastName.trim().length > 0 && email.trim().length > 0;

  const onSave = async () => {
    if (!dirty || !valid || saving) return;
    setSaving(true);
    try {
      const updated = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      await updateUser(updated);
      router.back();
    } catch (err) {
      Alert.alert("Couldn't save", err instanceof Error ? err.message : "Please try again.");
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Personal info</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          {user?.profileImageUrl ? null : (
            <LinearGradient colors={PrimaryGradient} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {initials(`${firstName} ${lastName}` || "?")}
              </Text>
            </LinearGradient>
          )}
          <TouchableOpacity
            onPress={() => Alert.alert("Change photo", "Photo upload is coming soon.")}
            accessibilityRole="button"
          >
            <Text style={styles.changePhoto}>Change photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.nameRow}>
          <Field label="First name" value={firstName} onChangeText={setFirstName} style={styles.half} />
          <Field label="Last name" value={lastName} onChangeText={setLastName} style={styles.half} />
        </View>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.fieldLabel}>Phone</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.phoneText}>{user?.phone ?? "—"}</Text>
          <View style={styles.verified}>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>
        <Text style={styles.hint}>Your number is your sign-in — contact support to change it.</Text>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={onSave} disabled={!dirty || !valid || saving}>
          <LinearGradient
            colors={dirty && valid && !saving ? PrimaryGradient : [Colors.border, Colors.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.ctaText}>Save changes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  style,
  ...props
}: {
  label: string;
  style?: object;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={Colors.textLight} accessibilityLabel={label} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
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
  body: { padding: 20, gap: 16 },
  avatarWrap: { alignItems: "center", gap: 8 },
  avatar: { width: 96, height: 96, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 32, fontWeight: "800", color: Colors.white },
  changePhoto: { fontSize: 15, fontWeight: "700", color: Colors.primary },

  nameRow: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  input: {
    minHeight: 52,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  phoneRow: {
    minHeight: 52,
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  phoneText: { fontSize: 16, color: Colors.textLight },
  verified: { backgroundColor: "#E4F2E8", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedText: { fontSize: 12, fontWeight: "700", color: "#2E6B4F" },
  hint: { fontSize: 13, color: Colors.textLight, marginTop: -6 },

  actionBar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.background },
  cta: { height: 54, borderRadius: 999, justifyContent: "center", alignItems: "center" },
  ctaText: { fontSize: 16, fontWeight: "700", color: Colors.white },
});
