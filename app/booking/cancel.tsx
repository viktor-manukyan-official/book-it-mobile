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

import { Colors } from "../../constants/colors";
import {
  AppointmentStateChangedError,
  cancelAppointment,
  fetchMyAppointment,
} from "../../src/services/bookingApi";
import type { CustomerAppointment } from "../../src/types/catalog";

const money = (n: number) => `${n.toLocaleString("en-US")} ֏`;
const OTHER_LIMIT = 200;
const REASONS = ["Schedule changed", "Found another time", "Other"];

function fmtContext(a: CustomerAppointment): string {
  const d = new Date(a.startTime);
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: a.timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: a.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  const tech = a.technicianName.split(" ")[0];
  return `${a.serviceName} · ${g("weekday")}, ${g("day")} ${g("month")} · ${time} with ${tech} at ${a.venueName}.`;
}

type Submit = "idle" | "submitting" | "error";

export default function CancelBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [appt, setAppt] = useState<CustomerAppointment | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [inside, setInside] = useState(false); // inside the free-cancel window
  const [reason, setReason] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [submit, setSubmit] = useState<Submit>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fee notice must be evaluated when the sheet opens (fresh from the record).
  useEffect(() => {
    if (!id) return;
    let active = true;
    void fetchMyAppointment(id)
      .then((a) => {
        if (!active) return;
        setAppt(a);
        const deadlineMs = new Date(a.startTime).getTime() - a.freeCancelMinutes * 60_000;
        setInside(Date.now() < deadlineMs);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const onConfirm = async () => {
    if (!appt || submit === "submitting") return; // single-flight
    setSubmit("submitting");
    setErrorMsg(null);
    const reasonValue = reason === "Other" ? otherText.trim() || "Other" : reason ?? undefined;
    try {
      await cancelAppointment(appt.id, appt.companyId, reasonValue);
      router.back(); // details re-fetches on focus and shows the cancelled state
    } catch (err) {
      if (err instanceof AppointmentStateChangedError) {
        // Venue changed it meanwhile — close; details will show the new state.
        router.back();
        return;
      }
      setSubmit("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Could not cancel. Please try again.",
      );
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
  const hasFee = appt.cancellationFee > 0;
  const feeText =
    appt.cancellationFeeType === "percentage" ? `${appt.cancellationFee}%` : money(appt.cancellationFee);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Cancel this booking?</Text>
        <Text style={styles.context}>{fmtContext(appt)}</Text>

        {/* Fee notice (evaluated on open) */}
        <View style={[styles.notice, inside ? styles.noticeGreen : styles.noticeAmber]}>
          <View style={[styles.noticeDot, { backgroundColor: inside ? Colors.success : Colors.star }]} />
          <Text style={styles.noticeText}>
            {inside ? (
              <>
                You&apos;re inside the free window — <Text style={styles.noticeStrong}>no fee</Text> if you
                cancel now.
              </>
            ) : hasFee ? (
              <>
                This is a late cancellation. A <Text style={styles.noticeStrong}>{feeText}</Text> fee may be
                applied by the venue and settled in person.
              </>
            ) : (
              <>This is a late cancellation. The venue will be notified — no fee applies.</>
            )}
          </Text>
        </View>

        {/* Reason */}
        <Text style={styles.reasonLabel}>
          Reason <Text style={styles.reasonOptional}>· optional</Text>
        </Text>
        <View style={styles.chips}>
          {REASONS.map((r) => {
            const on = reason === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
                onPress={() => setReason(on ? null : r)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={on ? styles.chipTextOn : styles.chipTextOff}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {reason === "Other" ? (
          <TextInput
            style={styles.otherInput}
            value={otherText}
            onChangeText={(t) => setOtherText(t.slice(0, OTHER_LIMIT))}
            placeholder="Tell the venue why (optional)"
            placeholderTextColor={Colors.textLight}
            multiline
            maxLength={OTHER_LIMIT}
            accessibilityLabel="Cancellation reason"
          />
        ) : null}

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.destructive, submitting && styles.destructiveDisabled]}
          onPress={onConfirm}
          disabled={submitting}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Yes, cancel booking"
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.destructiveText}>Yes, cancel booking</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.keep}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Keep my booking"
        >
          <Text style={styles.keepText}>Keep my booking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: "center", alignItems: "center" },
  body: { padding: 20, paddingTop: 8, gap: 14 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, color: Colors.textPrimary },
  context: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginTop: -6 },

  notice: { flexDirection: "row", gap: 10, borderRadius: 16, padding: 14 },
  noticeGreen: { backgroundColor: "#E4F2E8" },
  noticeAmber: { backgroundColor: "#FBF0E4" },
  noticeDot: { width: 8, height: 8, borderRadius: 999, marginTop: 6 },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  noticeStrong: { fontWeight: "700", color: Colors.textPrimary },

  reasonLabel: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary, marginTop: 4 },
  reasonOptional: { fontWeight: "400", color: Colors.textLight },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 44, borderRadius: 999, paddingHorizontal: 16, justifyContent: "center" },
  chipOn: { backgroundColor: Colors.textPrimary },
  chipOff: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipTextOn: { fontSize: 14, fontWeight: "600", color: Colors.white },
  chipTextOff: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  otherInput: {
    minHeight: 72,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlignVertical: "top",
  },
  errorText: { fontSize: 14, color: Colors.error, textAlign: "center" },

  actions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  destructive: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  destructiveDisabled: { opacity: 0.7 },
  destructiveText: { fontSize: 16, fontWeight: "700", color: Colors.white },
  keep: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  keepText: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
});
