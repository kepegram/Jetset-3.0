import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { useScrapbook } from "@/src/context/scrapbookContext";
import { lightTheme } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const TripDetail: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { state, listExcursions, deleteTrip } = useScrapbook();
  const currentTheme = lightTheme;
  const { tripId } = route.params as { tripId: string };
  const trip = state.trips.find((t) => t.id === tripId);
  const [excursions, setExcursions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    listExcursions(tripId).then(setExcursions);
  }, [tripId, listExcursions]);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      return () => {
        StatusBar.setBarStyle("dark-content");
      };
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      listExcursions(tripId).then(setExcursions);
    }, [tripId, listExcursions])
  );

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
    navigation.navigate("MemoryDetail", { excursion });
  };

  const pages = [
    { type: "cover", data: trip },
    ...excursions.map((excursion) => ({ type: "excursion", data: excursion })),
  ];

  const renderCoverPage = () => (
    <View style={styles.page}>
      <View style={styles.bookCover}>
        <View style={styles.bookSpine}>
          <View style={styles.spineDecoration} />
          <View style={styles.spineDecoration} />
          <View style={styles.spineDecoration} />
        </View>

        <View style={styles.coverContent}>
          <View style={[styles.cornerTape, styles.topLeftTape]} />
          <View style={[styles.cornerTape, styles.topRightTape]} />

          <View style={styles.coverPhotoFrame}>
            {trip.coverPhotoUri ? (
              <Image
                source={{ uri: trip.coverPhotoUri }}
                style={styles.coverPhoto}
              />
            ) : (
              <View style={styles.coverPhotoPlaceholder}>
                <Ionicons
                  name="camera-outline"
                  size={64}
                  color="rgba(0,0,0,0.2)"
                />
              </View>
            )}
          </View>

          <View style={styles.coverTitleArea}>
            <Text style={styles.coverTitle}>{trip.name}</Text>
            <View style={styles.coverMetaRow}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.coverMeta}>{trip.destination}</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Ionicons name="calendar" size={16} color="#666" />
              <Text style={styles.coverMeta}>
                {new Date(trip.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.memoryCount}>
              <Ionicons name="images" size={18} color="#FF6B6B" />
              <Text style={styles.memoryCountText}>
                {excursions.length}{" "}
                {excursions.length === 1 ? "Memory" : "Memories"}
              </Text>
            </View>
          </View>

          <View style={[styles.cornerTape, styles.bottomLeftTape]} />
          <View style={[styles.cornerTape, styles.bottomRightTape]} />

          <View style={styles.pageCurlHint}>
            <Ionicons name="chevron-forward" size={24} color="#999" />
            <Text style={styles.pageCurlText}>Swipe to view memories</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderExcursionPage = (excursion: any, index: number) => {
    const rotation = index % 3 === 0 ? -1 : index % 3 === 1 ? 0.5 : -0.5;

    return (
      <View style={styles.page}>
        <View style={styles.scrapbookPage}>
          <Text style={styles.pageNumber}>{index + 1}</Text>

          <View
            style={[
              styles.pageTape,
              {
                backgroundColor:
                  index % 3 === 0
                    ? "rgba(255, 220, 150, 0.7)"
                    : index % 3 === 1
                    ? "rgba(200, 230, 255, 0.7)"
                    : "rgba(255, 200, 200, 0.7)",
                transform: [{ rotate: `${rotation * 2}deg` }],
              },
            ]}
          />

          <Pressable
            style={styles.memoryCard}
            onPress={() => openGallery(excursion)}
          >
            {excursion.photoUris && excursion.photoUris.length > 0 && (
              <View
                style={[
                  styles.polaroid,
                  { transform: [{ rotate: `${rotation}deg` }] },
                ]}
              >
                <View style={styles.polaroidInner}>
                  <Image
                    source={{ uri: excursion.photoUris[0] }}
                    style={styles.polaroidImage}
                  />
                  {excursion.photoUris.length > 1 && (
                    <View style={styles.photoCountBadge}>
                      <Ionicons name="images" size={14} color="white" />
                      <Text style={styles.photoCountText}>
                        {excursion.photoUris.length}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.polaroidCaption}>
                  <Text style={styles.polaroidDate}>
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.memoryContent}>
              <Text style={styles.memoryTitle}>{excursion.title}</Text>
              {excursion.description && (
                <View style={styles.descriptionBox}>
                  <Text style={styles.memoryDescription} numberOfLines={6}>
                    {excursion.description}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          <View style={styles.pageDecoration}>
            <View
              style={[
                styles.smallTape,
                {
                  backgroundColor: "rgba(255, 220, 150, 0.6)",
                  transform: [{ rotate: "-25deg" }],
                  bottom: 120,
                  right: 30,
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderPage = ({ item, index }: any) => {
    if (item.type === "cover") {
      return renderCoverPage();
    } else {
      return renderExcursionPage(item.data, index - 1);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentPage(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

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
      <StatusBar barStyle="dark-content" animated />

      <View style={styles.topBar}>
        <Pressable
          style={styles.topBarButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={currentTheme.textPrimary}
          />
        </Pressable>

        <View style={styles.topBarCenter}>
          <Text
            style={[styles.topBarTitle, { color: currentTheme.textPrimary }]}
          >
            {trip.name}
          </Text>
          <View style={styles.pageIndicatorContainer}>
            {pages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.pageIndicatorDot,
                  {
                    backgroundColor:
                      currentPage === index
                        ? currentTheme.alternate
                        : currentTheme.inactive,
                    width: currentPage === index ? 8 : 6,
                    height: currentPage === index ? 8 : 6,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <Pressable style={styles.topBarButton} onPress={handleDeleteTrip}>
          <Ionicons name="trash-outline" size={24} color={currentTheme.error} />
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item, index) => `page-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
        contentContainerStyle={styles.pagesContainer}
      />

      {(currentPage === 0 || currentPage === pages.length - 1) && (
        <Pressable
          onPress={() => navigation.navigate("AddExcursion", { tripId })}
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
          <Text style={styles.addButtonText}>Add Memory</Text>
        </Pressable>
      )}
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
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  topBarButton: {
    padding: 8,
    width: 44,
  },
  topBarCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  pageIndicatorContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  pageIndicatorDot: {
    borderRadius: 4,
  },
  pagesContainer: {
    paddingVertical: 20,
  },
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  bookCover: {
    width: SCREEN_WIDTH - 60,
    height: SCREEN_HEIGHT - 200,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: -4,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    position: "relative",
  },
  bookSpine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: "#8B4513",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 40,
  },
  spineDecoration: {
    width: 2,
    height: 30,
    backgroundColor: "#D2B48C",
  },
  coverContent: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cornerTape: {
    position: "absolute",
    width: 60,
    height: 24,
    backgroundColor: "rgba(255, 220, 150, 0.7)",
    borderRadius: 2,
    zIndex: 10,
  },
  topLeftTape: {
    top: 20,
    left: 30,
    transform: [{ rotate: "-45deg" }],
  },
  topRightTape: {
    top: 20,
    right: 30,
    transform: [{ rotate: "45deg" }],
    backgroundColor: "rgba(200, 230, 255, 0.7)",
  },
  bottomLeftTape: {
    bottom: 20,
    left: 30,
    transform: [{ rotate: "45deg" }],
    backgroundColor: "rgba(255, 200, 200, 0.6)",
  },
  bottomRightTape: {
    bottom: 20,
    right: 30,
    transform: [{ rotate: "-45deg" }],
  },
  coverPhotoFrame: {
    width: "100%",
    aspectRatio: 3 / 2,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  coverPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  coverPhotoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  coverTitleArea: {
    alignItems: "center",
    gap: 8,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "System",
  },
  coverMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coverMeta: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  memoryCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFE5E5",
    borderRadius: 20,
  },
  memoryCountText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  pageCurlHint: {
    position: "absolute",
    bottom: 30,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pageCurlText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  scrapbookPage: {
    width: SCREEN_WIDTH - 60,
    height: SCREEN_HEIGHT - 200,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    position: "relative",
  },
  pageNumber: {
    position: "absolute",
    bottom: 16,
    right: 20,
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  pageTape: {
    position: "absolute",
    top: -8,
    left: "30%",
    width: 80,
    height: 30,
    borderRadius: 2,
    zIndex: 10,
  },
  memoryCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  polaroid: {
    backgroundColor: "#FFF",
    padding: 12,
    paddingBottom: 40,
    borderRadius: 4,
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
  polaroidInner: {
    width: SCREEN_WIDTH - 160,
    aspectRatio: 4 / 3,
    backgroundColor: "#F5F5F5",
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  },
  polaroidImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoCountBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  photoCountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  polaroidCaption: {
    marginTop: 8,
    alignItems: "center",
  },
  polaroidDate: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  memoryContent: {
    width: "100%",
    gap: 12,
  },
  memoryTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    fontFamily: "System",
  },
  descriptionBox: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  memoryDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
    fontFamily: "System",
  },
  pageDecoration: {
    position: "absolute",
  },
  smallTape: {
    position: "absolute",
    width: 50,
    height: 20,
    borderRadius: 2,
  },
  addButton: {
    position: "absolute",
    bottom: 32,
    right: 32,
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
