import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Fragment, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { getLanguage, LANGUAGES, setLanguage, type LanguageCode } from "../../src/services/language";

const TINTS: Record<LanguageCode, { bg: string; fg: string; tag: string }> = {
  en: { bg: "#F7D3C9", fg: "#C2554F", tag: "En" },
  hy: { bg: "#D3EAD9", fg: "#3F8A5C", tag: "Հա" },
  ru: { bg: "#E9D9F7", fg: "#7E4FC2", tag: "Ру" },
};

export default function LanguageScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<LanguageCode>("en");

  useEffect(() => {
    let active = true;
    void getLanguage().then((l) => active && setSelected(l));
    return () => {
      active = false;
    };
  }, []);

  const choose = (code: LanguageCode) => {
    setSelected(code); // applies immediately (persisted)
    void setLanguage(code);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Language</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Changes the app interface language. Venue and service names stay in the language the venue
          published them in.
        </Text>

        <View style={styles.card}>
          {LANGUAGES.map((l, i) => {
            const on = selected === l.code;
            const tint = TINTS[l.code];
            return (
              <Fragment key={l.code}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => choose(l.code)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <View style={[styles.tag, { backgroundColor: tint.bg }]}>
                    <Text style={[styles.tagText, { color: tint.fg }]}>{tint.tag}</Text>
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{l.label}</Text>
                    {l.native !== l.label ? <Text style={styles.rowNative}>{l.native}</Text> : null}
                  </View>
                  {on ? (
                    <View style={styles.check}>
                      <Ionicons name="checkmark" size={15} color={Colors.white} />
                    </View>
                  ) : (
                    <View style={styles.radioEmpty} />
                  )}
                </TouchableOpacity>
              </Fragment>
            );
          })}
        </View>

        <View style={styles.note}>
          <View style={styles.noteDot} />
          <Text style={styles.noteText}>
            Applies immediately. Your device language is used by default the first time you open BookIt.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
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
  intro: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },

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
  row: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 13 },
  tag: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  tagText: { fontSize: 13, fontWeight: "700" },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 17, fontWeight: "600", color: Colors.textPrimary },
  rowNative: { fontSize: 13, color: Colors.textLight },
  check: { width: 24, height: 24, borderRadius: 999, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  radioEmpty: { width: 24, height: 24, borderRadius: 999, borderWidth: 2, borderColor: Colors.border },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 53 },

  note: { flexDirection: "row", gap: 10, backgroundColor: Colors.card, borderRadius: 16, padding: 14 },
  noteDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: Colors.star, marginTop: 5 },
  noteText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
});
