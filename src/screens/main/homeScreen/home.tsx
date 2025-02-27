import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import React, { useState, useContext, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../../context/themeContext";
import { CreateTripContext } from "../../../context/createTripContext";
import { getAuth } from "firebase/auth";
import { doc, collection, getDocs, writeBatch } from "firebase/firestore";
import { FIREBASE_DB } from "../../../../firebase.config";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/appNav";
import { popularDestinations } from "../../../constants/popularDestinations";
import { RECOMMEND_TRIP_AI_PROMPT } from "../../../api/ai-prompt";
import { chatSession } from "../../../api/AI-Model";
import {
  GooglePlacesAutocomplete,
  GooglePlaceDetail,
} from "react-native-google-places-autocomplete";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import RecommendedTripSkeleton from "../../../components/common/RecommendedTripSkeleton";

// Interface for extended Google Place Details including photo information
interface ExtendedGooglePlaceDetail extends GooglePlaceDetail {
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
    html_attributions: string[];
  }>;
}

// Interface for recommended trip data structure
interface RecommendedTrip {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  photoRef?: string | null;
  fullResponse: string;
}

// Add this near the top of the file with other interfaces
interface AIError extends Error {
  message: string;
  status?: number;
}

// Add near the top with other interfaces
interface LoadingProgress {
  completed: number;
  total: number;
}

// Add this near the LoadingProgress interface
interface RecommendedTripsState {
  trips: RecommendedTrip[];
  status: "idle" | "loading" | "error" | "success";
  error: string | null;
  lastFetched: Date | null;
}

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "HomeMain">;

const Home: React.FC = () => {
  const { currentTheme } = useTheme();
  const { tripData = {}, setTripData = () => {} } =
    useContext(CreateTripContext) || {};
  const [recommendedTripsState, setRecommendedTripsState] =
    useState<RecommendedTripsState>({
      trips: [],
      status: "idle",
      error: null,
      lastFetched: null,
    });
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
    completed: 0,
    total: 3,
  });
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  const [tapCount, setTapCount] = useState<number>(0);
  const navigation = useNavigation<NavigationProp>();
  const googlePlacesRef = useRef<any>(null);

  // Generate appropriate greeting based on time of day
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return `Good Morning ☀️`;
    } else if (currentHour < 18) {
      return `Good Afternoon 🌤️`;
    } else {
      return `Good Evening 🌙`;
    }
  };

  const fetchPhotoReference = async (
    placeName: string
  ): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
          placeName
        )}&inputtype=textquery&fields=photos&key=${
          // @ts-ignore
          process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY
        }`
      );
      const data = await response.json();
      return data.candidates[0]?.photos[0]?.photo_reference || null;
    } catch (error) {
      console.error("Error fetching photo reference:", error);
      return null;
    }
  };

  const isValidTripResponse = (response: any): boolean => {
    return (
      response &&
      response.travelPlan &&
      response.travelPlan.destination &&
      response.travelPlan.destinationType &&
      response.travelPlan.itinerary &&
      Array.isArray(response.travelPlan.itinerary)
    );
  };

  // Add this utility function
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Modify the generateSingleTrip function
  const generateSingleTrip = async (
    retryCount = 0
  ): Promise<RecommendedTrip | null> => {
    const MAX_RETRIES = 3;
    const INITIAL_RETRY_DELAY = 1000;

    try {
      const result = await chatSession.sendMessage(RECOMMEND_TRIP_AI_PROMPT);
      const responseText = await result.response.text();

      if (!responseText) {
        throw new Error("Empty response from AI");
      }

      let tripResp;
      try {
        const cleanedResponse = responseText
          .trim()
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
        tripResp = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        if (retryCount < MAX_RETRIES) {
          await delay(INITIAL_RETRY_DELAY * Math.pow(2, retryCount));
          return generateSingleTrip(retryCount + 1);
        }
        return null;
      }

      if (!isValidTripResponse(tripResp)) {
        console.error("Invalid trip response structure");
        if (retryCount < MAX_RETRIES) {
          await delay(INITIAL_RETRY_DELAY * Math.pow(2, retryCount));
          return generateSingleTrip(retryCount + 1);
        }
        return null;
      }

      const placeName = tripResp.travelPlan.destination;
      const photoRef = await fetchPhotoReference(placeName);

      return {
        id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: placeName,
        description:
          tripResp.travelPlan.destinationDescription ||
          "No description available",
        photoRef,
        fullResponse: JSON.stringify(tripResp),
      };
    } catch (error) {
      const aiError = error as AIError;
      if (
        retryCount < MAX_RETRIES &&
        (aiError.message?.includes("503") ||
          aiError.message?.includes("overloaded") ||
          aiError.status === 503)
      ) {
        await delay(INITIAL_RETRY_DELAY * Math.pow(2, retryCount));
        return generateSingleTrip(retryCount + 1);
      }
      console.error("Error generating trip:", error);
      return null;
    }
  };

  // Add this utility function
  const generateTripsWithTimeout = async (
    promises: Promise<RecommendedTrip | null>[],
    timeout: number = 30000
  ): Promise<(RecommendedTrip | null)[]> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Generation timed out")), timeout);
    });

    try {
      const results: (RecommendedTrip | null)[] = [];
      for (let i = 0; i < promises.length; i++) {
        try {
          const result = await Promise.race([promises[i], timeoutPromise]);
          results.push(result);
          setLoadingProgress((prev) => ({
            ...prev,
            completed: prev.completed + 1,
          }));
        } catch (error) {
          console.error(`Error generating trip ${i + 1}:`, error);
          results.push(null);
          setLoadingProgress((prev) => ({
            ...prev,
            completed: prev.completed + 1,
          }));
        }
      }
      return results;
    } catch (error) {
      console.error("Trip generation timed out:", error);
      return [];
    }
  };

  // Modify useFocusEffect to check if it's the first login
  useFocusEffect(
    useCallback(() => {
      const checkFirstLogin = async () => {
        try {
          // For testing: Uncomment to clear storage between tests
          // await AsyncStorage.clear();

          const hasLoggedIn = await AsyncStorage.getItem("hasLoggedInBefore");
          console.log("hasLoggedInBefore value:", hasLoggedIn);

          if (!hasLoggedIn) {
            console.log("This is a first login!");
            setIsFirstLogin(true);
            // Set the flag that the user has logged in
            await AsyncStorage.setItem("hasLoggedInBefore", "true");
          } else {
            console.log("This is NOT a first login");
            setIsFirstLogin(false);
          }
        } catch (error) {
          console.error("Error checking first login:", error);
          setIsFirstLogin(false);
        }

        // Load trips regardless of login state
        loadExistingTrips();
      };

      checkFirstLogin();
    }, []) // Remove isFirstLogin from dependencies to prevent infinite loop
  );

  // Add this new function to load existing trips
  const loadExistingTrips = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log("Loading trips for user:", user.uid);
      console.log("First login status:", isFirstLogin);

      // Check if user has manually refreshed trips before
      const hasRefreshed = await AsyncStorage.getItem("hasRefreshedTrips");
      console.log("Has user refreshed trips before:", hasRefreshed);

      const userTripsCollection = collection(
        FIREBASE_DB,
        `users/${user.uid}/suggestedTrips`
      );

      // Check if user has suggested trips
      const userTripsSnapshot = await getDocs(userTripsCollection);
      console.log("User has existing trips:", !userTripsSnapshot.empty);

      // If user has their own trips, use them
      if (!userTripsSnapshot.empty) {
        const trips: RecommendedTrip[] = [];
        userTripsSnapshot.forEach((doc) => {
          const tripData = doc.data();
          trips.push(tripData as RecommendedTrip);
        });
        setRecommendedTripsState({
          trips: trips,
          status: "success",
          error: null,
          lastFetched: new Date(),
        });
        return;
      }

      // If the user doesn't have any trips yet, load from defaultTrips
      console.log("Looking for default trips to load...");
      const defaultTripsCollection = collection(FIREBASE_DB, "defaultTrips");
      const defaultTripsSnapshot = await getDocs(defaultTripsCollection);
      console.log("Number of default trips found:", defaultTripsSnapshot.size);

      if (!defaultTripsSnapshot.empty) {
        const defaultTrips: RecommendedTrip[] = [];
        // Only get up to 3 default trips
        defaultTripsSnapshot.docs.slice(0, 3).forEach((doc) => {
          const tripData = doc.data();
          defaultTrips.push(tripData as RecommendedTrip);
        });

        if (defaultTrips.length > 0) {
          console.log("Copying default trips to user collection...");
          // Save default trips to user collection
          const batch = writeBatch(FIREBASE_DB);

          defaultTrips.forEach((trip) => {
            const newTripRef = doc(userTripsCollection);
            // Create a new trip in the user's collection based on the default trip
            batch.set(newTripRef, {
              ...trip,
              id: `trip-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            });
          });

          await batch.commit();

          // Now load the trips again to get the user's newly created trips
          const updatedUserTripsSnapshot = await getDocs(userTripsCollection);
          const userTrips: RecommendedTrip[] = [];
          updatedUserTripsSnapshot.forEach((doc) => {
            const tripData = doc.data();
            userTrips.push(tripData as RecommendedTrip);
          });

          setRecommendedTripsState({
            trips: userTrips,
            status: "success",
            error: null,
            lastFetched: new Date(),
          });
          console.log("Successfully loaded default trips for new user");
          return;
        }
      }

      // If we reach here, there were no user trips or default trips
      console.log("No trips found (user or default)");
      setRecommendedTripsState((prev) => ({
        ...prev,
        status: "idle",
        error: null,
      }));
    } catch (error) {
      console.error("Error loading trips:", error);
      setRecommendedTripsState((prev) => ({
        ...prev,
        status: "error",
        error: "Failed to load trips",
      }));
    }
  };

  // Modify the handleRefresh function to handle the generation
  const handleRefresh = async () => {
    if (recommendedTripsState.status === "loading") return;

    try {
      setRecommendedTripsState((prev) => ({
        ...prev,
        status: "loading",
        error: null,
      }));
      setLoadingProgress({ completed: 0, total: 3 });

      const user = getAuth().currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const userTripsCollection = collection(
        FIREBASE_DB,
        `users/${user.uid}/suggestedTrips`
      );

      // Generate new trips
      const tripPromises = Array(3)
        .fill(null)
        .map((_, index) => delay(index * 500).then(() => generateSingleTrip()));

      const generatedTrips = await generateTripsWithTimeout(tripPromises);
      const validTrips = generatedTrips.filter(
        (trip): trip is RecommendedTrip => trip !== null
      );

      if (validTrips.length > 0) {
        const batch = writeBatch(FIREBASE_DB);

        // Delete existing trips
        const existingTripsSnapshot = await getDocs(userTripsCollection);
        existingTripsSnapshot.forEach((document) => {
          batch.delete(doc(userTripsCollection, document.id));
        });

        // Add new trips
        validTrips.forEach((trip) => {
          const newTripRef = doc(userTripsCollection);
          batch.set(newTripRef, trip);
        });

        await batch.commit();
        setRecommendedTripsState({
          trips: validTrips,
          status: "success",
          error: null,
          lastFetched: new Date(),
        });
        // Mark that the user has manually refreshed their trips
        await AsyncStorage.setItem("hasRefreshedTrips", "true");
        await AsyncStorage.setItem("lastFetchTime", new Date().toISOString());
      } else {
        throw new Error("No valid trips could be generated. Please try again.");
      }
    } catch (error) {
      setRecommendedTripsState((prev) => ({
        ...prev,
        status: "error",
        error:
          error instanceof Error ? error.message : "Failed to generate trips",
      }));
    }
  };

  // Type guard to check if a trip is a RecommendedTrip
  const isRecommendedTrip = (
    trip: RecommendedTrip | { id: string }
  ): trip is RecommendedTrip => {
    return (trip as RecommendedTrip).fullResponse !== undefined;
  };

  // Add this component for empty state
  const EmptyTripsState: React.FC<{ onRetry: () => void; theme: any }> = ({
    onRetry,
    theme,
  }) => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="compass-outline" size={50} color={theme.textSecondary} />
      <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
        No trips available at the moment
      </Text>
      <Pressable
        onPress={onRetry}
        style={[styles.retryButton, { backgroundColor: theme.alternate }]}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );

  // Hidden function to reset storage for testing
  const resetStorageForTesting = async () => {
    setTapCount((prev) => prev + 1);

    if (tapCount >= 7) {
      // Reset tap count
      setTapCount(0);

      try {
        // Clear AsyncStorage
        await AsyncStorage.clear();
        console.log("🧹 AsyncStorage cleared for testing!");
        // Force reload
        loadExistingTrips();

        // Show confirmation
        Alert.alert(
          "Storage Reset",
          "AsyncStorage has been cleared for testing. The app will treat this as a new login.",
          [{ text: "OK" }]
        );
      } catch (error) {
        console.error("Error resetting storage:", error);
      }
    }
  };

  return (
    <View testID="home-screen" style={{ flex: 1 }}>
      <ScrollView
        testID="home-scroll-view"
        style={[{ backgroundColor: currentTheme.background }]}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View testID="home-header" style={styles.header}>
          <View testID="home-image-container" style={styles.imageContainer}>
            <Image
              testID="home-header-image"
              source={require("../../../assets/app-imgs/travel.jpg")}
              style={styles.image}
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.7)"]}
              style={styles.overlay}
            />
          </View>
          <View testID="home-header-content" style={styles.headerContent}>
            <Text
              testID="home-greeting"
              style={styles.greetingText}
              onPress={resetStorageForTesting}
            >
              {getGreeting()}
            </Text>
            <Text testID="home-subgreeting" style={styles.subGreetingText}>
              Let's plan your next adventure!
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.recommendedTripsContainer,
            { backgroundColor: currentTheme.background },
          ]}
        >
          <View testID="home-search-container" style={styles.searchContainer}>
            <GooglePlacesAutocomplete
              ref={googlePlacesRef}
              placeholder="Where would you like to go?"
              textInputProps={{
                placeholderTextColor: currentTheme.textSecondary,
                selectionColor: currentTheme.alternate,
              }}
              fetchDetails={true}
              onPress={(
                data,
                details: ExtendedGooglePlaceDetail | null = null
              ) => {
                if (details) {
                  const photoReference =
                    details.photos?.[0]?.photo_reference || null;
                  setTripData({
                    locationInfo: {
                      name: data.description,
                      coordinates: details.geometry.location,
                      photoRef: photoReference,
                      url: details.url,
                    },
                  });
                  // Clear input
                  if (googlePlacesRef.current) {
                    googlePlacesRef.current.clear();
                  }
                  // @ts-ignore - Nested navigation type issue
                  navigation.navigate("MyTrips", {
                    screen: "ChooseDate",
                  });
                }
              }}
              query={{
                // @ts-ignore
                key: process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY,
                language: "en",
              }}
              styles={{
                container: {
                  flex: 0,
                },
                textInputContainer: {
                  backgroundColor: "transparent",
                },
                textInput: {
                  height: 55,
                  borderRadius: 15,
                  paddingHorizontal: 45,
                  fontSize: 16,
                  fontFamily:
                    Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
                  backgroundColor: currentTheme.shadowBackground,
                  ...Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    },
                    android: {
                      elevation: 3,
                    },
                  }),
                },
                listView: {
                  backgroundColor: currentTheme.accentBackground,
                  borderRadius: 12,
                  marginTop: 10,
                  marginHorizontal: 0,
                  elevation: 3,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                },
                row: {
                  backgroundColor: currentTheme.accentBackground,
                  padding: 15,
                  height: "auto",
                  minHeight: 50,
                },
                separator: {
                  backgroundColor: `${currentTheme.textSecondary}20`,
                  height: 1,
                },
                description: {
                  color: currentTheme.textPrimary,
                  fontSize: 16,
                },
                poweredContainer: {
                  backgroundColor: currentTheme.accentBackground,
                  borderTopWidth: 1,
                  borderColor: `${currentTheme.textSecondary}20`,
                },
                powered: {
                  tintColor: currentTheme.textSecondary,
                },
              }}
              renderLeftButton={() => (
                <View style={styles.searchIcon}>
                  <Ionicons
                    name="search"
                    size={24}
                    color={currentTheme.textSecondary}
                  />
                </View>
              )}
            />
          </View>
          <View style={styles.recommendedTripsHeader}>
            <Text
              style={[
                styles.recommendedTripsTitle,
                { color: currentTheme.textPrimary },
              ]}
            >
              Popular Destinations
            </Text>
          </View>
          <FlatList
            testID="popular-destinations-list"
            horizontal
            data={popularDestinations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                testID={`destination-item-${item.id}`}
                onPress={() => {
                  navigation.navigate("PopularDestinations", {
                    destination: item,
                  });
                }}
                style={({ pressed }) => [
                  styles.popularDestinationContainer,
                  {
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
              >
                <Image
                  testID={`destination-image-${item.id}`}
                  source={item.image}
                  style={styles.popularDestinationImage}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.popularDestinationGradient}
                />
                <Text
                  testID={`destination-name-${item.id}`}
                  style={styles.popularDestinationText}
                >
                  {item.name.split(",")[0]}
                </Text>
              </Pressable>
            )}
            showsHorizontalScrollIndicator={false}
          />
          <View style={styles.recommendedTripsHeader}>
            <Text
              style={[
                styles.recommendedTripsTitle,
                { color: currentTheme.textPrimary },
              ]}
            >
              Recommended Trips
            </Text>
            <Pressable
              onPress={handleRefresh}
              disabled={recommendedTripsState.status === "loading"}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <Ionicons
                name="refresh"
                size={28}
                color={currentTheme.textPrimary}
                style={
                  recommendedTripsState.status === "loading"
                    ? styles.spinningIcon
                    : undefined
                }
              />
            </Pressable>
          </View>
          {recommendedTripsState.status === "loading" ? (
            <View style={{ flexDirection: "row" }}>
              {[1, 2, 3].map((_, index) => (
                <RecommendedTripSkeleton
                  key={index}
                  loadingProgress={
                    loadingProgress.completed / loadingProgress.total
                  }
                  isFirstCard={index === 0}
                  status={
                    index < loadingProgress.completed ? "completed" : "loading"
                  }
                />
              ))}
            </View>
          ) : recommendedTripsState.status === "error" ? (
            <EmptyTripsState onRetry={handleRefresh} theme={currentTheme} />
          ) : recommendedTripsState.trips.length > 0 ? (
            <FlatList
              testID="recommended-trips-list"
              horizontal
              data={[
                ...recommendedTripsState.trips,
                { id: "dont-like-button" },
              ]}
              keyExtractor={(trip) => trip.id}
              renderItem={({ item: trip }) => {
                if (trip.id === "dont-like-button") {
                  return (
                    <View style={styles.dontLikeButtonContainer}>
                      <Pressable
                        onPress={() => navigation.navigate("WhereTo")}
                        style={({ pressed }) => [
                          styles.dontLikeButton,
                          {
                            borderColor: currentTheme.alternate,
                            opacity: pressed ? 0.8 : 1,
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                          },
                        ]}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={40}
                          color={currentTheme.alternate}
                          style={styles.createTripIcon}
                        />
                        <Text
                          style={[
                            styles.dontLikeButtonText,
                            { color: currentTheme.alternate },
                          ]}
                        >
                          Create Your Own{"\n"}Adventure
                        </Text>
                      </Pressable>
                    </View>
                  );
                } else if (isRecommendedTrip(trip)) {
                  const tripInfo = JSON.parse(trip.fullResponse);
                  return (
                    <Pressable
                      testID={`trip-card-${trip.id}`}
                      onPress={() => {
                        navigation.navigate("RecommendedTripDetails", {
                          trip: trip.fullResponse,
                          photoRef: trip.photoRef ?? "",
                        });
                      }}
                      style={({ pressed }) => [
                        styles.tripCard,
                        {
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                          backgroundColor: currentTheme.shadowBackground,
                        },
                      ]}
                    >
                      {trip.photoRef && (
                        <View style={styles.tripImageContainer}>
                          <Image
                            testID={`trip-image-${trip.id}`}
                            source={{
                              // @ts-ignore
                              uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${trip.photoRef}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY}`,
                            }}
                            style={styles.tripImage}
                          />
                          <LinearGradient
                            colors={["transparent", "rgba(0,0,0,0.7)"]}
                            style={styles.tripImageGradient}
                          />
                        </View>
                      )}
                      <View style={styles.tripInfoContainer}>
                        <Ionicons
                          name="location-outline"
                          size={20}
                          color={currentTheme.textPrimary}
                          style={styles.tripLocationIcon}
                        />
                        <View style={styles.tripTextContainer}>
                          <Text
                            testID={`trip-name-${trip.id}`}
                            style={[
                              styles.tripName,
                              { color: currentTheme.textPrimary },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {trip.name}
                          </Text>
                          <Text
                            testID={`trip-description-${trip.id}`}
                            style={[
                              styles.tripDescription,
                              { color: currentTheme.textSecondary },
                            ]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {tripInfo.travelPlan.destinationDescription}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                }
                return null;
              }}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedTripsContent}
            />
          ) : (
            <EmptyTripsState onRetry={handleRefresh} theme={currentTheme} />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: "100%",
    height: 280,
    zIndex: -1,
  },
  imageContainer: {
    position: "absolute",
    top: -30,
    left: 0,
    right: 0,
  },
  image: {
    width: "100%",
    height: 280,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  greetingText: {
    fontSize: 32,
    color: "white",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
    fontWeight: "bold",
    alignSelf: "flex-start",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subGreetingText: {
    fontSize: 20,
    color: "white",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
    alignSelf: "flex-start",
    marginTop: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  recommendedTripsContainer: {
    width: "100%",
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -100,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchIcon: {
    position: "absolute",
    left: 15,
    top: 15,
    zIndex: 1,
  },
  popularDestinationContainer: {
    marginRight: 15,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  popularDestinationImage: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: 15,
  },
  popularDestinationGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderRadius: 15,
  },
  popularDestinationText: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  recommendedTripsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 10,
  },
  recommendedTripsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  dontLikeButtonContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: width * 0.6,
    height: width * 0.8,
    padding: 20,
  },
  dontLikeButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderStyle: "dashed",
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  dontLikeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
    marginTop: 10,
  },
  createTripIcon: {
    marginBottom: 10,
  },
  tripCard: {
    borderRadius: 15,
    marginRight: 20,
    width: width * 0.6,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  tripImageContainer: {
    position: "relative",
  },
  tripImage: {
    width: "100%",
    height: width * 0.6,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  tripImageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  tripInfoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 15,
  },
  tripLocationIcon: {
    marginRight: 8,
    marginTop: 3,
  },
  tripTextContainer: {
    flex: 1,
  },
  tripName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  tripDescription: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  noTripsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noTripsText: {
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
    textAlign: "center",
    color: "grey",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
    marginBottom: 20,
  },
  refreshButton: {
    padding: 15,
    borderRadius: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    height: 200,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  spinningIcon: {
    transform: [{ rotate: "45deg" }],
  },
  recommendedTripsContent: {
    paddingRight: 20,
  },
});

export default Home;
