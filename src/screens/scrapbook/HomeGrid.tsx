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
import { useScrapbook } from "../../context/scrapbookContext";
import { useTheme } from "../../context/themeContext";
import { Ionicons } from "@expo/vector-icons";

const HomeGrid: React.FC = () => {
  const { state, listTrips, sync } = useScrapbook();
  const navigation = useNavigation<any>();
  const { currentTheme } = useTheme();

  const renderItem = useCallback(
    ({ item }: any) => (
      <Pressable
        style={({ pressed }) => [
          styles.tripCard,
          { backgroundColor: currentTheme.background },
          pressed && styles.tripCardPressed,
        ]}
        onPress={() => navigation.navigate("TripDetail", { tripId: item.id })}
      >
        <View style={styles.imageContainer}>
          {item.coverPhotoUri ? (
            <Image
              source={{ uri: item.coverPhotoUri }}
              style={styles.coverImage}
            />
          ) : (
            <View
              style={[
                styles.placeholderImage,
                { backgroundColor: currentTheme.inactive },
              ]}
            >
              <Ionicons
                name="camera-outline"
                size={32}
                color={currentTheme.textSecondary}
              />
              <Text
                style={[
                  styles.placeholderText,
                  { color: currentTheme.textSecondary },
                ]}
              >
                No Cover
              </Text>
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <Text
            style={[styles.tripName, { color: currentTheme.textPrimary }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.tripYear, { color: currentTheme.textSecondary }]}
          >
            {new Date(item.startDate).getFullYear()}
          </Text>
        </View>
      </Pressable>
    ),
    [navigation, currentTheme]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
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
            <View style={styles.emptyContent}>
              <Ionicons
                name="airplane-outline"
                size={64}
                color={currentTheme.textSecondary}
              />
              <Text
                style={[
                  styles.emptyText,
                  { color: currentTheme.textSecondary },
                ]}
              >
                No trips yet
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  { color: currentTheme.textSecondary },
                ]}
              >
                Start your first adventure!
              </Text>
            </View>
          </View>
        )}
      />
      <Pressable
        onPress={() => navigation.navigate("AddTrip")}
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: currentTheme.alternate },
          pressed && styles.addButtonPressed,
        ]}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Trip</Text>
      </Pressable>
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
    paddingBottom: 100, // Space for floating button
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
  },
  tripCard: {
    width: cardWidth,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tripCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    height: 140,
    overflow: "hidden",
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
  cardContent: {
    padding: 12,
  },
  tripName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
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
});
