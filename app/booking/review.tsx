import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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
import { useServiceDetail } from "../../src/hooks/useServiceDetail";
import { createAppointment, SlotTakenError } from "../../src/services/bookingApi";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const NOTE_LIMIT = 500;

const money = (n: number) => `${n.toLocaleString("en-US")} ֏`;

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function fmtDateLong(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return `${WEEKDAY[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// "8:30 on 4 Aug" for `start - freeCancelMinutes`, in the venue timezone.
function fmtDeadline(startIso: string, freeCancelMinutes: number, tz: string): string {
  const d = new Date(new Date(startIso).getTime() - freeCancelMinutes * 60_000);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "numeric", month: "short" }).format(d);
  return `${time} on ${day}`;
}

type Submit = "idle" | "submitting" | "error";

export default function BookingReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    serviceId?: string;
    date?: string;
    start?: string;
    end?: string;
    technicianId?: string;
    technicianName?: string;
    price?: string;
  }>();

  const { service, loading } = useServiceDetail(params.serviceId ?? "");
  const [notes, setNotes] = useState("");
  const [submit, setSubmit] = useState<Submit>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const start = params.start ?? "";
  const end = params.end ?? "";
  const date = params.date ?? "";
  const technicianName = params.technicianName ?? "";
  const tz = service?.timezone ?? "UTC";
  const price = service?.price ?? (params.price ? Number(params.price) : 0);

  const onConfirm = async () => {
    if (!service || !user || submit === "submitting") return; // single-flight guard
    setSubmit("submitting");
    setErrorMsg(null);
    try {
      // technicianId is the technician auto-assigned for the chosen time: when the
      // customer picked "Any", the time-selection screen collapses duplicate start
      // times to the FIRST available technician (already filtered by the gender
      // preference), and that technician's id is carried here. When a specific
      // technician was chosen, it's simply that one.
      const appt = await createAppointment({
        companyId: service.venueId,
        locationId: service.locationId,
        serviceId: service.id,
        technicianId: params.technicianId ?? "",
        customerId: user.id,
        startTime: start,
        notes,
      });
      router.replace({
        pathname: "/booking/confirmed",
        params: {
          appointmentId: appt.id,
          status: appt.status,
          name: service.name,
          date,
          start,
          end,
          technicianName,
          venueName: service.venueName,
          price: String(price),
        },
      });
    } catch (err) {
      if (err instanceof SlotTakenError) {
        // Someone took it first — go back to time selection, which re-fetches on
        // focus, clears the stale selection and shows an explanatory message.
        router.back();
        return;
      }
      setSubmit("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Could not confirm your booking. Please try again.",
      );
    }
  };

  if (loading || !service) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const submitting = submit === "submitting";
  const where = [service.venueAddress, service.venueCity].filter(Boolean).join(", ");
  const hasFee = service.cancellationFee > 0;
  const feeText =
    service.cancellationFeeType === "percentage"
      ? `${service.cancellationFee}%`
      : money(service.cancellationFee);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Review your booking</Text>
        <Text style={styles.subtitle}>Nothing to pay now — pay at the venue.</Text>

        {/* Summary card */}
        <View style={styles.card}>
          <View style={styles.serviceRow}>
            <View style={styles.tile}>
              <Text style={styles.tileText}>{initials(service.name)}</Text>
            </View>
            <View style={styles.serviceBody}>
              <Text style={styles.serviceName} numberOfLines={1}>
                {service.name}
              </Text>
              <Text style={styles.serviceMeta} numberOfLines={1}>
                {service.duration} min{service.categoryName ? ` · ${service.categoryName}` : ""}
              </Text>
            </View>
            <Text style={styles.price}>{money(price)}</Text>
          </View>

          <View style={styles.divider} />

          <SummaryLine label="Date" value={fmtDateLong(date)} />
          <SummaryLine
            label="Time"
            value={start && end ? `${fmtTime(start, tz)} – ${fmtTime(end, tz)}` : ""}
          />
          <SummaryLine label="Technician" value={technicianName} />
          <SummaryLine
            label="Where"
            value={service.venueName}
            sub={where || undefined}
          />
        </View>

        {/* Notes */}
        <Text style={styles.notesLabel}>
          Notes <Text style={styles.notesOptional}>· optional</Text>
        </Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={(t) => setNotes(t.slice(0, NOTE_LIMIT))}
          placeholder="Anything we should know? Allergies, styling goals, arriving with a friend..."
          placeholderTextColor={Colors.textLight}
          multiline
          maxLength={NOTE_LIMIT}
          accessibilityLabel="Booking notes"
        />
        {notes.length > NOTE_LIMIT - 100 ? (
          <Text style={styles.noteCount}>
            {notes.length}/{NOTE_LIMIT}
          </Text>
        ) : null}

        {/* Cancellation notice */}
        <View style={styles.cancelCard}>
          <View style={styles.cancelDot} />
          <Text style={styles.cancelText}>
            Free cancellation until{" "}
            <Text style={styles.cancelStrong}>
              {fmtDeadline(start, service.freeCancelMinutes, tz)}
            </Text>
            .{hasFee ? ` After that a ` : ""}
            {hasFee ? <Text style={styles.cancelStrong}>{feeText}</Text> : null}
            {hasFee ? ` fee may apply.` : ""}
          </Text>
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
      </ScrollView>

      {/* Confirm */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onConfirm}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Confirm booking"
        >
          <LinearGradient
            colors={submitting ? [Colors.border, Colors.border] : PrimaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.ctaText}>Confirm booking</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function SummaryLine({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <View style={styles.summaryValueWrap}>
        <Text style={styles.summaryValue} numberOfLines={1}>
          {value}
        </Text>
        {sub ? (
          <Text style={styles.summarySub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: "center", alignItems: "center" },
  body: { padding: 20, paddingTop: 8, gap: 14 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.6, color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: -8 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FBD5D0",
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: { fontSize: 20, fontWeight: "700", color: "#C2554F" },
  serviceBody: { flex: 1, minWidth: 0, gap: 3 },
  serviceName: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  serviceMeta: { fontSize: 13, color: Colors.textSecondary },
  price: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },

  summaryLine: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  summaryLabel: { fontSize: 15, color: Colors.textSecondary },
  summaryValueWrap: { flex: 1, minWidth: 0, alignItems: "flex-end" },
  summaryValue: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary, textAlign: "right" },
  summarySub: { fontSize: 14, color: Colors.textSecondary, textAlign: "right" },

  notesLabel: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary, marginTop: 4 },
  notesOptional: { fontWeight: "400", color: Colors.textLight },
  notesInput: {
    minHeight: 92,
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
  noteCount: { fontSize: 12, color: Colors.textLight, textAlign: "right", marginTop: -8 },

  cancelCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FBF0E4",
    borderRadius: 16,
    padding: 14,
  },
  cancelDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: Colors.star, marginTop: 6 },
  cancelText: { flex: 1, fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  cancelStrong: { fontWeight: "700", color: Colors.textPrimary },

  errorText: { fontSize: 14, color: Colors.error, textAlign: "center" },

  actionBar: {
    backgroundColor: Colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  cta: { height: 54, borderRadius: 999, justifyContent: "center", alignItems: "center" },
  ctaText: { fontSize: 16, fontWeight: "700", color: Colors.white },
});
