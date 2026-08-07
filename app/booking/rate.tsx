import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, PrimaryGradient } from "../../constants/colors";
import { AlreadyReviewedError, createReview, fetchMyAppointment } from "../../src/services/bookingApi";
import type { CustomerAppointment } from "../../src/types/catalog";

const NOTE_LIMIT = 500;
const TAGS = ["Great result", "On time", "Friendly", "Clean space", "Good value"];

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

function fmtSubtitle(a: CustomerAppointment): string {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: a.timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(new Date(a.startTime));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const tech = a.technicianName.split(" ")[0];
  return `${a.serviceName} with ${tech} · ${g("weekday")}, ${g("day")} ${g("month")}`;
}

type Submit = "idle" | "submitting" | "error";

export default function RateVisitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [appt, setAppt] = useState<CustomerAppointment | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submit, setSubmit] = useState<Submit>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void fetchMyAppointment(id)
      .then((a) => active && setAppt(a))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const toggleTag = (t: string) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const onSubmit = async () => {
    if (!appt || rating < 1 || submit === "submitting") return; // single-flight + required rating
    setSubmit("submitting");
    setErrorMsg(null);
    try {
      await createReview({ appointmentId: appt.id, rating, tags, note });
      router.back(); // details re-fetches on focus and hides "Rate your visit"
    } catch (err) {
      if (err instanceof AlreadyReviewedError) {
        router.back();
        return;
      }
      setSubmit("error");
      setErrorMsg(err instanceof Error ? err.message : "Could not submit. Please try again.");
    }
  };

  if (loading || !appt) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const submitting = submit === "submitting";

  return (
    <View style={styles.container}>
      <View style={[styles.skipRow, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Skip">
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(appt.technicianName)}</Text>
        </View>
        <Text style={styles.heading}>How was your visit?</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {fmtSubtitle(appt)}
        </Text>

        {/* Stars */}
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              style={styles.star}
              onPress={() => setRating(n)}
              accessibilityRole="button"
              accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`}
              accessibilityState={{ selected: rating >= n }}
            >
              <Text style={[styles.starGlyph, { color: rating >= n ? Colors.star : "#D8D8DE" }]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tags */}
        <Text style={styles.sectionLabel}>What stood out?</Text>
        <View style={styles.chips}>
          {TAGS.map((t) => {
            const on = tags.includes(t);
            return (
              <TouchableOpacity
                key={t}
                style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
                onPress={() => toggleTag(t)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={on ? styles.chipTextOn : styles.chipTextOff}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note */}
        <Text style={styles.noteLabel}>
          Add a note <Text style={styles.noteOptional}>· optional</Text>
        </Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={(t) => setNote(t.slice(0, NOTE_LIMIT))}
          placeholder="Share a few words about your experience..."
          placeholderTextColor={Colors.textLight}
          multiline
          maxLength={NOTE_LIMIT}
          accessibilityLabel="Review note"
        />
        {note.length > NOTE_LIMIT - 100 ? (
          <Text style={styles.noteCount}>
            {note.length}/{NOTE_LIMIT}
          </Text>
        ) : null}

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onSubmit}
          disabled={rating < 1 || submitting}
          accessibilityRole="button"
          accessibilityLabel="Submit review"
        >
          <LinearGradient
            colors={rating >= 1 && !submitting ? PrimaryGradient : [Colors.border, Colors.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={[styles.ctaText, rating < 1 && styles.ctaTextDisabled]}>Submit review</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: "center", alignItems: "center" },
  skipRow: { paddingHorizontal: 20, alignItems: "flex-end" },
  skip: { fontSize: 16, fontWeight: "600", color: Colors.textSecondary, minHeight: 44, paddingTop: 8 },
  body: { paddingHorizontal: 24, paddingBottom: 24, alignItems: "center", gap: 14 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: "#F7D3C9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  avatarText: { fontSize: 30, fontWeight: "700", color: "#C2554F" },
  heading: { fontSize: 30, fontWeight: "800", letterSpacing: -0.6, color: Colors.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },

  stars: { flexDirection: "row", gap: 6, marginTop: 8 },
  star: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  starGlyph: { fontSize: 40 },

  sectionLabel: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  chip: { minHeight: 44, borderRadius: 999, paddingHorizontal: 18, justifyContent: "center" },
  chipOn: { backgroundColor: Colors.textPrimary },
  chipOff: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipTextOn: { fontSize: 14, fontWeight: "600", color: Colors.white },
  chipTextOff: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },

  noteLabel: { alignSelf: "flex-start", fontSize: 15, fontWeight: "600", color: Colors.textPrimary, marginTop: 8 },
  noteOptional: { fontWeight: "400", color: Colors.textLight },
  noteInput: {
    alignSelf: "stretch",
    minHeight: 96,
    maxHeight: 160,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlignVertical: "top",
  },
  noteCount: { alignSelf: "flex-end", fontSize: 12, color: Colors.textLight },
  errorText: { fontSize: 14, color: Colors.error, textAlign: "center" },

  actionBar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.background },
  cta: { height: 54, borderRadius: 999, justifyContent: "center", alignItems: "center" },
  ctaText: { fontSize: 16, fontWeight: "700", color: Colors.white },
  ctaTextDisabled: { color: Colors.textLight },
});
