import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { BackButton } from "./BackButton";

export interface LegalSection {
  heading: string;
  body: string;
}

interface LegalDocumentProps {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

/**
 * Shared chrome for the in-app Terms and Privacy screens: a back header, title,
 * "last updated" line, and a scrollable list of sections. Content is passed in
 * so each legal document is just data.
 */
export function LegalDocument({ title, updatedAt, intro, sections }: LegalDocumentProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        {router.canGoBack() ? <BackButton onPress={() => router.back()} /> : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.updated}>Last updated {updatedAt}</Text>
        <Text style={styles.intro}>{intro}</Text>

        {sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 52, justifyContent: "center", paddingHorizontal: 20 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, gap: 14 },
  title: {
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: Colors.textPrimary,
  },
  updated: { fontSize: 13, color: Colors.textLight },
  intro: { fontSize: 15, lineHeight: 23, color: Colors.textSecondary, marginTop: 4 },
  section: { gap: 6, marginTop: 8 },
  sectionHeading: { fontSize: 17, fontWeight: "600", color: Colors.textPrimary },
  sectionBody: { fontSize: 15, lineHeight: 23, color: Colors.textSecondary },
});
