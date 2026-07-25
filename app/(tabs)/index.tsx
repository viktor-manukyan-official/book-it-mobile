import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import {
  SALONS,
  CATEGORIES,
  CATEGORY_FILTER_MAP,
  type Category,
  type Salon,
} from "../../data/mock";

function SalonCard({ salon }: { salon: Salon }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/salon/${salon.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${salon.name}, ${salon.area}, rated ${salon.rating} stars`}
    >
      <View
        style={[styles.cardImage, { backgroundColor: salon.coverColor }]}
      >
        <Text style={styles.cardImageText}>
          {salon.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{salon.name}</Text>
        <View style={styles.cardRow}>
          <View style={styles.areaBadge}>
            <Text style={styles.areaText}>{salon.area}</Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={Colors.star} />
            <Text style={styles.ratingText}>
              {salon.rating} ({salon.reviewCount})
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filteredSalons = useMemo(() => {
    const filterValue = CATEGORY_FILTER_MAP[activeCategory];
    if (filterValue === null) return SALONS;
    return SALONS.filter((s) => s.category === filterValue);
  }, [activeCategory]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Find a service in Yerevan</Text>
        <Text style={styles.subtitle}>
          Book salons, barbers &amp; clinics
        </Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={20}
          color={Colors.textLight}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search salons, barbers, clinics..."
          placeholderTextColor={Colors.textLight}
          editable={true}
          accessibilityLabel="Search salons, barbers, clinics"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
        style={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = cat === activeCategory;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                isActive
                  ? styles.categoryButtonActive
                  : styles.categoryButtonInactive,
              ]}
              onPress={() => setActiveCategory(cat)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Filter by ${cat}`}
            >
              <Text
                style={[
                  styles.categoryText,
                  isActive
                    ? styles.categoryTextActive
                    : styles.categoryTextInactive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredSalons}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SalonCard salon={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No places found in this category
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  categoryScroll: {
    marginTop: 16,
    flexGrow: 0,
  },
  categoryRow: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
  },
  categoryButtonInactive: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: Colors.white,
  },
  categoryTextInactive: {
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardImage: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  cardImageText: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.white,
  },
  cardContent: {
    padding: 16,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  areaBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  areaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
