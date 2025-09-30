import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { useScrapbook } from "../../context/scrapbookContext";
import { useTheme } from "../../context/themeContext";
import { Ionicons } from "@expo/vector-icons";

const TripDetail: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { state, listExcursions, deleteTrip } = useScrapbook();
  const { currentTheme } = useTheme();
  const { tripId } = route.params as { tripId: string };
  const trip = state.trips.find((t) => t.id === tripId);
  const [excursions, setExcursions] = useState<any[]>([]);
  const [filteredExcursions, setFilteredExcursions] = useState<any[]>([]);
  const [selectedExcursion, setSelectedExcursion] = useState<any>(null);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    listExcursions(tripId).then(setExcursions);
  }, [tripId, listExcursions]);

  // Refresh excursions when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      listExcursions(tripId).then(setExcursions);
    }, [tripId, listExcursions])
  );

  // Filter excursions based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredExcursions(excursions);
    } else {
      const filtered = excursions.filter(
        (excursion) =>
          excursion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          excursion.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredExcursions(filtered);
    }
  }, [excursions, searchQuery]);

  const handleDeleteTrip = () => {
    Alert.alert(
      "Delete Trip",
      `Are you sure you want to delete "${trip?.name}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTrip(tripId);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to delete trip. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (!trip) return null;

  const openGallery = (excursion: any) => {
    setSelectedExcursion(excursion);
    setGalleryVisible(true);
  };

  const renderExcursion = ({ item }: any) => (
    <Pressable
      style={[
        styles.excursionCard,
        { backgroundColor: currentTheme.background },
      ]}
      onPress={() => openGallery(item)}
    >
      <View style={styles.excursionHeader}>
        <Text
          style={[styles.excursionTitle, { color: currentTheme.textPrimary }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {item.photoUris?.length > 0 && (
          <View style={styles.photoCountBadge}>
            <Ionicons name="images" size={12} color="white" />
            <Text style={styles.photoCountText}>{item.photoUris.length}</Text>
          </View>
        )}
      </View>

      {item.photoUris?.[0] && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.photoUris[0] }}
            style={styles.excursionImage}
          />
          {item.photoUris.length > 1 && (
            <View style={styles.morePhotosOverlay}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.morePhotosText}>
                +{item.photoUris.length - 1}
              </Text>
            </View>
          )}
        </View>
      )}

      {item.description && (
        <Text
          style={[
            styles.excursionDescription,
            { color: currentTheme.textSecondary },
          ]}
          numberOfLines={3}
        >
          {item.description}
        </Text>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
      edges={["top"]}
    >
      {/* Top Navigation Bar */}
      <View
        style={[styles.topBar, { backgroundColor: currentTheme.background }]}
      >
        <Pressable
          style={styles.topBarButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentTheme.textPrimary}
          />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: currentTheme.textPrimary }]}>
          {trip.name}
        </Text>
        <Pressable style={styles.topBarButton} onPress={handleDeleteTrip}>
          <Ionicons name="trash-outline" size={24} color={currentTheme.error} />
        </Pressable>
      </View>

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: currentTheme.accentBackground },
        ]}
      >
        {trip.coverPhotoUri && (
          <Image
            source={{ uri: trip.coverPhotoUri }}
            style={styles.coverImage}
          />
        )}
        <View style={styles.headerContent}>
          <Text
            style={[styles.tripName, { color: currentTheme.textPrimary }]}
            numberOfLines={2}
          >
            {trip.name}
          </Text>
          <View style={styles.tripMeta}>
            <Ionicons
              name="location-outline"
              size={16}
              color={currentTheme.textSecondary}
            />
            <Text
              style={[
                styles.destination,
                { color: currentTheme.textSecondary },
              ]}
            >
              {trip.destination}
            </Text>
          </View>
          <View style={styles.tripMeta}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={currentTheme.textSecondary}
            />
            <Text
              style={[styles.dateRange, { color: currentTheme.textSecondary }]}
            >
              {new Date(trip.startDate).toLocaleDateString()} -{" "}
              {new Date(trip.endDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      {excursions.length > 0 && (
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: currentTheme.accentBackground },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={currentTheme.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: currentTheme.textPrimary }]}
              placeholder="Search entries..."
              placeholderTextColor={currentTheme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={currentTheme.textSecondary}
                />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Excursions List */}
      <FlatList
        data={filteredExcursions}
        keyExtractor={(e) => e.id}
        renderItem={renderExcursion}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyContent}>
              <Ionicons
                name={searchQuery ? "search-outline" : "images-outline"}
                size={64}
                color={currentTheme.textSecondary}
              />
              <Text
                style={[
                  styles.emptyText,
                  { color: currentTheme.textSecondary },
                ]}
              >
                {searchQuery ? "No entries found" : "No entries yet"}
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  { color: currentTheme.textSecondary },
                ]}
              >
                {searchQuery
                  ? "Try a different search term"
                  : "Start documenting your adventure!"}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Add Entry Button */}
      <Pressable
        onPress={() => navigation.navigate("AddExcursion", { tripId })}
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: currentTheme.alternate },
          pressed && styles.addButtonPressed,
        ]}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Entry</Text>
      </Pressable>

      {/* Photo Gallery Modal */}
      <Modal
        visible={galleryVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGalleryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.galleryContainer,
              { backgroundColor: currentTheme.background },
            ]}
          >
            <View style={styles.galleryHeader}>
              <Text
                style={[
                  styles.galleryTitle,
                  { color: currentTheme.textPrimary },
                ]}
              >
                {selectedExcursion?.title}
              </Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setGalleryVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={currentTheme.textPrimary}
                />
              </Pressable>
            </View>

            {selectedExcursion?.description && (
              <Text
                style={[
                  styles.galleryDescription,
                  { color: currentTheme.textSecondary },
                ]}
              >
                {selectedExcursion.description}
              </Text>
            )}

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.photoScrollView}
            >
              {selectedExcursion?.photoUris?.map(
                (uri: string, index: number) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image
                      source={{ uri }}
                      style={styles.galleryImage}
                      resizeMode="contain"
                    />
                  </View>
                )
              )}
            </ScrollView>

            {selectedExcursion?.photoUris?.length > 1 && (
              <View style={styles.photoIndicator}>
                <Text
                  style={[
                    styles.photoIndicatorText,
                    { color: currentTheme.textSecondary },
                  ]}
                >
                  {selectedExcursion.photoUris.length} photos
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TripDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  topBarButton: {
    padding: 8,
    minWidth: 40,
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  coverImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: "cover",
  },
  headerContent: {
    gap: 8,
  },
  tripName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  tripMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  destination: {
    fontSize: 16,
    fontWeight: "500",
  },
  dateRange: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Space for floating button
    flexGrow: 1,
  },
  excursionCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  excursionHeader: {
    padding: 16,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  excursionTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  photoCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  photoCountText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  imageContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    position: "relative",
  },
  excursionImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    resizeMode: "cover",
  },
  morePhotosOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  morePhotosText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  excursionDescription: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 16,
  },
  // Gallery Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryContainer: {
    width: "95%",
    height: "85%",
    borderRadius: 16,
    overflow: "hidden",
  },
  galleryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  galleryTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  galleryDescription: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  photoScrollView: {
    flex: 1,
  },
  photoContainer: {
    width: Dimensions.get("window").width * 0.95,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  photoIndicator: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  photoIndicatorText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Search Styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
});
