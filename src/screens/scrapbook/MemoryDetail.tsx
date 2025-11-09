import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
  FlatList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { lightTheme } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const POLAROID_MAX_WIDTH = Math.min(SCREEN_WIDTH - 120, 400);

const MemoryDetail: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const currentTheme = lightTheme;
  const { excursion } = route.params as { excursion: any };
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      return () => {
        StatusBar.setBarStyle("dark-content");
      };
    }, [])
  );

  if (!excursion) return null;

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
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle="dark-content" animated />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={currentTheme.textPrimary}
          />
        </Pressable>
        <View style={styles.headerContent}>
          <Text
            style={[styles.headerTitle, { color: currentTheme.textPrimary }]}
            numberOfLines={1}
          >
            {excursion.title}
          </Text>
          {excursion.photoUris?.length > 1 && (
            <Text style={styles.photoCount}>
              {excursion.photoUris.length} photos
            </Text>
          )}
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.galleryContainer}>
        <FlatList
          data={excursion.photoUris || []}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `photo-${index}`}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / SCREEN_WIDTH
            );
            setCurrentPhotoIndex(index);
          }}
          renderItem={({ item, index }) => (
            <View style={styles.galleryPhotoPage}>
              <View
                style={[
                  styles.galleryTape,
                  {
                    backgroundColor:
                      index % 3 === 0
                        ? "rgba(255, 220, 150, 0.7)"
                        : index % 3 === 1
                        ? "rgba(200, 230, 255, 0.7)"
                        : "rgba(255, 200, 200, 0.7)",
                    transform: [
                      { rotate: index % 2 === 0 ? "-45deg" : "45deg" },
                    ],
                  },
                ]}
              />

              <View
                style={[
                  styles.galleryPolaroid,
                  {
                    transform: [
                      {
                        rotate:
                          index % 3 === 0
                            ? "-1deg"
                            : index % 3 === 1
                            ? "0.5deg"
                            : "-0.5deg",
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.galleryPolaroidInner}>
                  <Image
                    source={{ uri: item }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.galleryPolaroidCaption}>
                  <Text style={styles.galleryPolaroidText}>
                    Photo {index + 1} of {excursion.photoUris.length}
                  </Text>
                </View>
              </View>
            </View>
          )}
          snapToInterval={SCREEN_WIDTH}
          decelerationRate="fast"
          snapToAlignment="center"
        />
      </View>

      {excursion.description && (
        <View style={styles.descriptionContainer}>
          <View style={styles.descriptionBox}>
            <Ionicons
              name="create-outline"
              size={20}
              color="#FF6B6B"
              style={styles.descriptionIcon}
            />
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.descriptionScroll}
            >
              <Text
                style={[
                  styles.description,
                  { color: currentTheme.textSecondary },
                ]}
              >
                {excursion.description}
              </Text>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default MemoryDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  backButton: {
    padding: 8,
    width: 44,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  photoCount: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  galleryContainer: {
    flex: 1,
    minHeight: 0,
  },
  galleryPhotoPage: {
    width: SCREEN_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    position: "relative",
  },
  galleryTape: {
    position: "absolute",
    top: 40,
    width: 80,
    height: 30,
    borderRadius: 2,
    zIndex: 10,
  },
  galleryPolaroid: {
    backgroundColor: "#FFF",
    padding: 16,
    paddingBottom: 50,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    maxWidth: SCREEN_WIDTH - 80,
    alignSelf: "center",
  },
  galleryPolaroidInner: {
    width: POLAROID_MAX_WIDTH,
    aspectRatio: 4 / 5,
    backgroundColor: "#F5F5F5",
    borderRadius: 2,
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  galleryPolaroidCaption: {
    marginTop: 12,
    alignItems: "center",
  },
  galleryPolaroidText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    fontWeight: "500",
  },
  descriptionContainer: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  descriptionBox: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionIcon: {
    marginBottom: 8,
  },
  descriptionScroll: {
    maxHeight: 100,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "System",
  },
});
