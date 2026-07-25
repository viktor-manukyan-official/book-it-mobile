import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import { SALONS, formatPrice } from "../../data/mock";

export default function SalonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const salon = SALONS.find((s) => s.id === id) ?? SALONS[0];
  const [selectedTime, setSelectedTime] = useState(salon.timeSlots[0]);

  const handleBook = () => {
    Alert.alert(
      "Booking Confirmed",
      "Your appointment has been booked successfully!"
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View
          style={[styles.hero, { backgroundColor: salon.coverColor }]}
        >
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 8 }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{salon.name}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.salonName}>{salon.name}</Text>
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.infoText}>{salon.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.infoText}>{salon.hours}</Text>
          </View>
          <Text style={styles.description}>{salon.description}</Text>
        </View>

        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Services</Text>
          {salon.services.map((service) => (
            <View key={service.name} style={styles.serviceRow}>
              <View>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDuration}>{service.duration}</Text>
              </View>
              <Text style={styles.servicePrice}>
                {formatPrice(service.price)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.timeSlotsSection}>
          <Text style={styles.sectionTitle}>Available Times</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeSlotsRow}
          >
            {salon.timeSlots.map((slot) => {
              const isSelected = slot === selectedTime;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlot,
                    isSelected
                      ? styles.timeSlotSelected
                      : styles.timeSlotUnselected,
                  ]}
                  onPress={() => setSelectedTime(slot)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Time slot ${slot}`}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      isSelected
                        ? styles.timeSlotTextSelected
                        : styles.timeSlotTextUnselected,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.bookButton,
          { marginBottom: insets.bottom + 10 },
        ]}
        onPress={handleBook}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Book Appointment"
      >
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  hero: {
    height: 250,
    justifyContent: "flex-end",
    padding: 20,
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.white,
  },
  infoSection: {
    padding: 20,
  },
  salonName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
    lineHeight: 22,
  },
  servicesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  serviceName: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  serviceDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
  timeSlotsSection: {
    padding: 20,
  },
  timeSlotsRow: {
    flexDirection: "row",
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary,
  },
  timeSlotUnselected: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: "500",
  },
  timeSlotTextSelected: {
    color: Colors.white,
  },
  timeSlotTextUnselected: {
    color: Colors.textPrimary,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    marginHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.white,
  },
});
