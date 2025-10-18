import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useScrapbook } from "@/src/context/scrapbookContext";
import { lightTheme } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";

const HomeGrid: React.FC = () => {
  const { state, listTrips, sync } = useScrapbook();
  const navigation = useNavigation<any>();
  const currentTheme = lightTheme;

  const renderItem = useCallback(
    ({ item, index }: any) => {
      // Alternate rotation for scrapbook effect
      const rotation =
        index % 4 === 0 ? -2 : index % 4 === 1 ? 1.5 : index % 4 === 2 ? -1 : 2;

      return (
        <Pressable
          style={({ pressed }) => [
            styles.tripCard,
            {
              transform: [{ rotate: `${pressed ? 0 : rotation}deg` }],
            },
            pressed && styles.tripCardPressed,
          ]}
          onPress={() => navigation.navigate("TripDetail", { tripId: item.id })}
        >
          {/* Polaroid-style card */}
          <View style={[styles.polaroidCard, { backgroundColor: "#FAFAFA" }]}>
            {/* Tape effect */}
            <View
              style={[
                styles.tape,
                {
                  backgroundColor: "rgba(255, 220, 150, 0.6)",
                  transform: [{ rotate: "-45deg" }],
                },
              ]}
            />

            {/* Photo area */}
            <View style={styles.photoFrame}>
              {item.coverPhotoUri ? (
                <Image
                  source={{ uri: item.coverPhotoUri }}
                  style={styles.coverImage}
                />
              ) : (
                <View
                  style={[
                    styles.placeholderImage,
                    { backgroundColor: currentTheme.alternateLight20 },
                  ]}
                >
                  <Ionicons
                    name="camera-outline"
                    size={40}
                    color={currentTheme.alternate}
                  />
                </View>
              )}
            </View>

            {/* Handwritten-style caption */}
            <View style={styles.captionArea}>
              <Text style={styles.tripName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.tripDate}>
                {new Date(item.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [navigation, currentTheme]
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            currentTheme.background === "#FFFFFF"
              ? "#F8F5F0"
              : currentTheme.background,
        },
      ]}
      edges={["top"]}
    >
      <FlatList
        data={state.trips}
        numColumns={2}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {/* Background grid preview */}
            <View style={styles.gridPreview}>
              <View style={styles.gridRow}>
                <View
                  style={[
                    styles.gridCard,
                    { backgroundColor: currentTheme.inactive },
                  ]}
                />
                <View
                  style={[
                    styles.gridCard,
                    { backgroundColor: currentTheme.inactive },
                  ]}
                />
              </View>
              <View style={styles.gridRow}>
                <View
                  style={[
                    styles.gridCard,
                    { backgroundColor: currentTheme.inactive },
                  ]}
                />
                <View
                  style={[
                    styles.gridCard,
                    { backgroundColor: currentTheme.inactive },
                  ]}
                />
              </View>
              <View style={styles.gridRow}>
                <View
                  style={[
                    styles.gridCard,
                    { backgroundColor: currentTheme.inactive },
                  ]}
                />
                <View
                  style={[
                    styles.gridCard,
                    { backgroundColor: currentTheme.inactive },
                  ]}
                />
              </View>
            </View>

            <View style={styles.emptyContent}>
              {/* Decorative background elements */}
              <View style={styles.decorativeElements}>
                <View
                  style={[
                    styles.decorativeCircle,
                    styles.circle1,
                    { backgroundColor: currentTheme.alternateLight20 },
                  ]}
                />
                <View
                  style={[
                    styles.decorativeCircle,
                    styles.circle2,
                    { backgroundColor: currentTheme.alternateLight10 },
                  ]}
                />
                <View
                  style={[
                    styles.decorativeCircle,
                    styles.circle3,
                    { backgroundColor: currentTheme.alternateLight30 },
                  ]}
                />
              </View>

              {/* Main illustration */}
              <View style={styles.illustrationContainer}>
                <View
                  style={[
                    styles.illustrationBackground,
                    { backgroundColor: currentTheme.alternateLight10 },
                  ]}
                >
                  <Ionicons
                    name="airplane"
                    size={48}
                    color={currentTheme.alternate}
                  />
                </View>
                <View style={styles.floatingIcons}>
                  <Ionicons
                    name="camera"
                    size={20}
                    color={currentTheme.alternateLight50}
                    style={styles.floatingIcon1}
                  />
                  <Ionicons
                    name="location"
                    size={18}
                    color={currentTheme.alternateLight50}
                    style={styles.floatingIcon2}
                  />
                  <Ionicons
                    name="heart"
                    size={16}
                    color={currentTheme.alternateLight50}
                    style={styles.floatingIcon3}
                  />
                </View>
              </View>

              {/* Main heading */}
              <Text
                style={[styles.emptyTitle, { color: currentTheme.textPrimary }]}
              >
                Your Adventure Awaits! ✈️
              </Text>

              {/* Subtitle */}
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: currentTheme.textSecondary },
                ]}
              >
                Start documenting your travels and create beautiful memories
                that last forever
              </Text>

              {/* Feature highlights */}
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={currentTheme.alternate}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      { color: currentTheme.textSecondary },
                    ]}
                  >
                    Capture precious moments
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={currentTheme.alternate}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      { color: currentTheme.textSecondary },
                    ]}
                  >
                    Organize by trips & excursions
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={currentTheme.alternate}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      { color: currentTheme.textSecondary },
                    ]}
                  >
                    Share your stories
                  </Text>
                </View>
              </View>

              {/* Call to action */}
              <Pressable
                onPress={() => navigation.navigate("AddTrip")}
                style={({ pressed }) => [
                  styles.emptyCtaButton,
                  { backgroundColor: currentTheme.alternate },
                  pressed && styles.emptyCtaButtonPressed,
                ]}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.emptyCtaText}>Create Your First Trip</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* Add Trip Button - Scrapbook Style (only show when trips exist) */}
      {state.trips.length > 0 && (
        <Pressable
          onPress={() => navigation.navigate("AddTrip")}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: "#FF6B6B",
              transform: pressed
                ? [{ scale: 0.95 }, { rotate: "0deg" }]
                : [{ scale: 1 }, { rotate: "-2deg" }],
            },
          ]}
        >
          <Ionicons name="add-circle" size={22} color="white" />
          <Text style={styles.addButtonText}>Add Trip</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
};

export default HomeGrid;

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2; // Account for padding and gap

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
  },
  tripCard: {
    width: cardWidth,
    marginBottom: 24,
    alignItems: "center",
  },
  tripCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  polaroidCard: {
    width: "100%",
    borderRadius: 4,
    padding: 12,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  tape: {
    position: "absolute",
    top: -8,
    right: 20,
    width: 60,
    height: 24,
    zIndex: 10,
    borderRadius: 2,
  },
  photoFrame: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F5F5F5",
    marginBottom: 12,
    overflow: "hidden",
    borderRadius: 2,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  captionArea: {
    alignItems: "center",
    gap: 2,
  },
  tripName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    fontFamily: "System",
  },
  tripDate: {
    fontSize: 12,
    fontWeight: "400",
    color: "#666",
    fontFamily: "System",
  },
  cardContent: {
    padding: 12,
  },
  tripYear: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    position: "relative",
  },
  gridPreview: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    opacity: 0.15,
    zIndex: 0,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridCard: {
    width: cardWidth,
    height: 180,
    borderRadius: 16,
    opacity: 0.3,
  },
  emptyContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 320,
  },
  decorativeElements: {
    position: "absolute",
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    zIndex: 0,
  },
  decorativeCircle: {
    position: "absolute",
    borderRadius: 50,
    opacity: 0.3,
  },
  circle1: {
    width: 100,
    height: 100,
    top: 20,
    right: 30,
  },
  circle2: {
    width: 60,
    height: 60,
    bottom: 40,
    left: 20,
  },
  circle3: {
    width: 80,
    height: 80,
    top: 60,
    left: 10,
  },
  illustrationContainer: {
    position: "relative",
    marginBottom: 32,
    zIndex: 1,
  },
  illustrationBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  floatingIcons: {
    position: "absolute",
    width: 100,
    height: 100,
  },
  floatingIcon1: {
    position: "absolute",
    top: -10,
    right: -5,
  },
  floatingIcon2: {
    position: "absolute",
    bottom: -5,
    left: -10,
  },
  floatingIcon3: {
    position: "absolute",
    top: 20,
    left: -15,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 32,
  },
  emptySubtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.8,
  },
  featureList: {
    width: "100%",
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 12,
    fontWeight: "500",
  },
  emptyCtaButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyCtaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  emptyCtaText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  addButtonText: {
    color: "white",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 16,
  },
});
