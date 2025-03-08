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
import {
  doc,
  collection,
  getDocs,
  writeBatch,
  getDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
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
import { useProfile } from "../../../context/profileContext";
import { useRecommendedTrips } from "../../../context/recommendedTripsContext";
import { useTrip } from "../../../context/createTripContext";
import {
  getUserPreferences,
  updateUserPreferences,
  clearUserPreferences,
} from "../../../utils/userPreferences";
import { UserPreferences } from "../../../types/home.types";
import { retryWithBackoff } from "../../../utils/common.utils";

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
  tripPlan: any; // This will store the full response
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
  currentTripIndex: number;
  tripStatuses: Array<"waiting" | "loading" | "completed" | "error">;
}

// Add this near the LoadingProgress interface
interface RecommendedTripsState {
  trips: RecommendedTrip[];
  status: "idle" | "loading" | "error" | "success";
  error: string | null;
  lastFetched: Date | null;
}

const { width } = Dimensions.get("window");

// Update the RootStackParamList type definition
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList & {
    Notifications: undefined;
  },
  "HomeMain"
>;

const Home: React.FC = () => {
  const { currentTheme } = useTheme();
  const { displayName } = useProfile();
  const { tripData, setTripData } = useTrip();
  const {
    recommendedTripsState,
    setRecommendedTripsState,
    loadingProgress,
    setLoadingProgress,
  } = useRecommendedTrips();
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  const [tapCount, setTapCount] = useState<number>(0);
  const navigation = useNavigation<NavigationProp>();
  const googlePlacesRef = useRef<any>(null);
  const [hasGeneratedTrips, setHasGeneratedTrips] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [hasNotifications, setHasNotifications] = useState<boolean>(false);
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);

  // Update the checkUnreadNotifications function to use real-time updates
  const checkUnreadNotifications = useCallback(() => {
    const user = getAuth().currentUser;
    if (!user) return;

    try {
      const notificationsRef = collection(
        FIREBASE_DB,
        `users/${user.uid}/notifications`
      );
      const unreadQuery = query(notificationsRef, where("read", "==", false));

      // Set up real-time listener for notifications
      const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
        setHasNotifications(!snapshot.empty);
      });

      // Return unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  }, []);

  // Update useFocusEffect to handle real-time updates
  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const user = getAuth().currentUser;
        if (user) {
          try {
            const userDoc = await getDoc(doc(FIREBASE_DB, "users", user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setUserName(data?.name || data?.username || "");
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        }
      };

      fetchUserData();
      // Set up notification listener
      const unsubscribe = checkUnreadNotifications();

      // Only load trips if they haven't been loaded or if there's an error
      if (
        recommendedTripsState.status === "idle" ||
        recommendedTripsState.error
      ) {
        loadExistingTrips();
      }

      // Cleanup function
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }, [
      checkUnreadNotifications,
      recommendedTripsState.status,
      recommendedTripsState.error,
    ])
  );

  // Generate appropriate greeting based on time of day
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    const firstName =
      displayName?.split(" ")[0] || userName?.split(" ")[0] || "there"; // Get first name from displayName or userName, fallback to 'there'

    // Determine text size based on name length
    const nameLength = firstName.length;
    let fontSize = 28; // Default size
    if (nameLength > 12) {
      fontSize = 24;
    } else if (nameLength > 15) {
      fontSize = 22;
    }

    if (currentHour < 12) {
      return { text: `Morning, ${firstName} ☀️`, fontSize };
    } else if (currentHour < 18) {
      return { text: `Afternoon, ${firstName} 🌤️`, fontSize };
    } else {
      return { text: `Evening, ${firstName} 🌙`, fontSize };
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

  // Add these utility functions near the top of the file, after the interfaces
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const generateTripWithRetry = async (
    attempt: number = 1,
    maxAttempts: number = 3,
    baseDelay: number = 2000
  ): Promise<RecommendedTrip | null> => {
    try {
      // Exponential backoff delay
      if (attempt > 1) {
        const delay =
          baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await wait(delay);
      }

      const result = await chatSession.sendMessage(RECOMMEND_TRIP_AI_PROMPT);
      let responseText = await result.response.text();

      if (!responseText) {
        throw new Error("Empty response from AI");
      }

      let tripResp;
      try {
        // First, try to extract JSON from markdown if present
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          responseText = jsonMatch[1];
        }

        // Basic cleanup first
        let cleanedResponse = responseText
          .trim()
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
          .replace(/\n/g, " ") // Remove newlines
          .replace(/\s+/g, " "); // Normalize spaces

        // Find the JSON object boundaries
        const startIdx = cleanedResponse.indexOf("{");
        const endIdx = cleanedResponse.lastIndexOf("}") + 1;

        if (startIdx !== -1 && endIdx > startIdx) {
          cleanedResponse = cleanedResponse.slice(startIdx, endIdx);
        }

        try {
          // First attempt with minimal cleaning
          tripResp = JSON.parse(cleanedResponse);
        } catch (initialParseError) {
          // If that fails, try more aggressive cleaning
          cleanedResponse = cleanedResponse
            .replace(/,(?=\s*[}\]])/g, "") // Remove trailing commas
            .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Quote unquoted keys
            .replace(/:\s*'([^']*)'/g, ':"$1"') // Convert single quotes to double quotes
            .replace(/\\(?=[^"\\])/g, "\\\\") // Escape backslashes
            .replace(/(?<!\\)"/g, '\\"') // Escape unescaped quotes
            .replace(/\\/g, "\\\\") // Double escape backslashes
            .replace(/\\\\"/g, '\\"'); // Fix double escaped quotes

          tripResp = JSON.parse(cleanedResponse);
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        console.log("Raw response:", responseText);

        if (attempt < maxAttempts) {
          return generateTripWithRetry(attempt + 1, maxAttempts, baseDelay);
        }
        throw new Error(
          `Failed to parse response after ${maxAttempts} attempts`
        );
      }

      if (!isValidTripResponse(tripResp)) {
        console.error(
          "Invalid trip response structure:",
          JSON.stringify(tripResp, null, 2)
        );
        if (attempt < maxAttempts) {
          return generateTripWithRetry(attempt + 1, maxAttempts, baseDelay);
        }
        throw new Error("Invalid trip response structure");
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
        tripPlan: tripResp,
      };
    } catch (error) {
      const aiError = error as AIError;
      console.error(`Attempt ${attempt} failed:`, aiError);

      const shouldRetry =
        attempt < maxAttempts &&
        (aiError.message?.includes("503") ||
          aiError.message?.includes("429") ||
          aiError.message?.includes("overloaded") ||
          aiError.message?.includes("parse") ||
          aiError.message?.includes("timeout") ||
          aiError.status === 503 ||
          aiError.status === 429);

      if (shouldRetry) {
        return generateTripWithRetry(attempt + 1, maxAttempts, baseDelay);
      }

      return null;
    }
  };

  const generateTripsWithTimeout = async (
    numberOfTrips: number = 3,
    timeout: number = 120000 // Increased timeout to 120 seconds
  ): Promise<(RecommendedTrip | null)[]> => {
    const results: (RecommendedTrip | null)[] = [];
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Generation timed out")), timeout);
    });

    try {
      // Generate trips with increased delays between attempts
      for (let i = 0; i < numberOfTrips; i++) {
        try {
          setLoadingProgress((prev) => ({
            ...prev,
            currentTripIndex: i,
            tripStatuses: prev.tripStatuses.map((status, index) =>
              index === i ? "loading" : status
            ),
          }));

          // Add increasing delay between trip generations
          if (i > 0) {
            await wait(5000 * i); // 5 second base delay, multiplied by trip index
          }

          const tripPromise = generateTripWithRetry();
          const result = await Promise.race([tripPromise, timeoutPromise]);

          results.push(result);
          setLoadingProgress((prev) => ({
            ...prev,
            completed: prev.completed + 1,
            tripStatuses: prev.tripStatuses.map((status, index) =>
              index === i ? (result ? "completed" : "error") : status
            ),
          }));

          // If this generation failed, wait a bit longer before the next attempt
          if (!result && i < numberOfTrips - 1) {
            await wait(7000); // Wait 7 seconds before trying the next trip
          }
        } catch (error) {
          console.error(`Error generating trip ${i + 1}:`, error);
          results.push(null);
          setLoadingProgress((prev) => ({
            ...prev,
            completed: prev.completed + 1,
            tripStatuses: prev.tripStatuses.map((status, index) =>
              index === i ? "error" : status
            ),
          }));

          // Wait before trying the next trip after an error
          if (i < numberOfTrips - 1) {
            await wait(7000);
          }
        }
      }

      // If we have at least one successful trip, consider it a partial success
      const validTrips = results.filter(
        (trip): trip is RecommendedTrip => trip !== null
      );
      if (validTrips.length > 0) {
        return results;
      }

      throw new Error("Failed to generate any valid trips");
    } catch (error) {
      console.error("Trip generation failed:", error);
      return results; // Return any partial results we might have
    }
  };

  // Update checkFirstLogin to use the new preferences system
  useFocusEffect(
    useCallback(() => {
      const initializeUser = async () => {
        try {
          const user = getAuth().currentUser;
          if (!user) {
            throw new Error("User not authenticated");
          }

          const preferences = await getUserPreferences(user.uid);
          setUserPreferences(preferences);

          if (!preferences.hasCompletedOnboarding) {
            await updateUserPreferences(user.uid, {
              hasCompletedOnboarding: true,
            });
            setIsFirstLogin(true);
          } else {
            setIsFirstLogin(false);
          }

          // Load trips regardless of login state
          loadExistingTrips();
        } catch (error) {
          console.error("Error initializing user:", error);
          setIsFirstLogin(false);
        }
      };

      initializeUser();
    }, [])
  );

  // Add this function to check if user has generated trips before
  const checkHasGeneratedTrips = async () => {
    try {
      const hasGenerated = await AsyncStorage.getItem("hasGeneratedTrips");
      setHasGeneratedTrips(!!hasGenerated);
    } catch (error) {
      console.error("Error checking generated trips status:", error);
    }
  };

  // Update loadExistingTrips with better error handling and retry logic
  const loadExistingTrips = async () => {
    if (
      recommendedTripsState.status === "loading" ||
      loadingProgress.completed > 0
    )
      return;

    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error("User not authenticated");

      // Try to load user's own trips first
      const loadUserTrips = async () => {
        const userTripsCollection = collection(
          FIREBASE_DB,
          `users/${user.uid}/suggestedTrips`
        );
        const userTripsSnapshot = await getDocs(userTripsCollection);

        if (!userTripsSnapshot.empty) {
          const trips: RecommendedTrip[] = [];
          userTripsSnapshot.forEach((doc) => {
            const tripData = doc.data();
            trips.push({
              id: tripData.id,
              name: tripData.name,
              description: tripData.description,
              imageUrl: tripData.imageUrl,
              photoRef:
                tripData.photoRef === null ? undefined : tripData.photoRef,
              tripPlan: tripData.tripPlan,
            });
          });
          return trips.sort((a, b) => a.id.localeCompare(b.id));
        }
        return null;
      };

      // Try to load user trips with retry logic
      const userTrips = await retryWithBackoff(loadUserTrips, 3, 1000);

      if (userTrips) {
        setRecommendedTripsState({
          trips: userTrips,
          status: "success",
          error: null,
          lastFetched: new Date(),
        });
        return;
      }

      // If no user trips and user hasn't generated trips before, try loading default trips
      if (!userPreferences?.hasGeneratedTrips) {
        const loadDefaultTrips = async () => {
          const defaultTripsCollection = collection(
            FIREBASE_DB,
            "defaultTrips"
          );
          const defaultTripsSnapshot = await getDocs(defaultTripsCollection);

          if (!defaultTripsSnapshot.empty) {
            const defaultTrips: RecommendedTrip[] = [];
            defaultTripsSnapshot.forEach((doc) => {
              const data = doc.data();
              defaultTrips.push({
                id: data.id,
                name: data.name,
                description: data.description,
                imageUrl: data.imageUrl,
                photoRef: data.photoRef,
                tripPlan: data.tripPlan,
              } as RecommendedTrip);
            });
            return defaultTrips.sort((a, b) => a.id.localeCompare(b.id));
          }
          return null;
        };

        // Try to load default trips with retry logic
        const defaultTrips = await retryWithBackoff(loadDefaultTrips, 3, 1000);

        if (defaultTrips) {
          setRecommendedTripsState({
            trips: defaultTrips,
            status: "success",
            error: null,
            lastFetched: new Date(),
          });
          return;
        }
      }

      // If we reach here, show empty state
      setRecommendedTripsState((prev) => ({
        ...prev,
        trips: [],
        status: "idle",
        error: null,
      }));
    } catch (error) {
      console.error("Error loading trips:", error);
      setRecommendedTripsState((prev) => ({
        ...prev,
        trips: [],
        status: "error",
        error: "Failed to load trips. Please try again.",
      }));
    }
  };

  // Update handleRefresh to use the new preferences system
  const handleRefresh = async () => {
    if (recommendedTripsState.status === "loading") return;

    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error("User not authenticated");

      setRecommendedTripsState((prev) => ({
        ...prev,
        status: "loading",
        error: null,
      }));
      setLoadingProgress({
        completed: 0,
        total: 3,
        currentTripIndex: 0,
        tripStatuses: ["waiting", "waiting", "waiting"],
      });

      const generatedTrips = await generateTripsWithTimeout(3);
      const validTrips = generatedTrips.filter(
        (trip): trip is RecommendedTrip => trip !== null
      );

      if (validTrips.length > 0) {
        const batch = writeBatch(FIREBASE_DB);
        const userTripsCollection = collection(
          FIREBASE_DB,
          `users/${user.uid}/suggestedTrips`
        );

        // Delete existing user trips
        const existingUserTripsSnapshot = await getDocs(userTripsCollection);
        existingUserTripsSnapshot.forEach((document) => {
          batch.delete(doc(userTripsCollection, document.id));
        });

        // Add new trips
        validTrips.forEach((trip) => {
          const userTripRef = doc(userTripsCollection);
          batch.set(userTripRef, trip);
        });

        await batch.commit();

        // Update user preferences
        await updateUserPreferences(user.uid, {
          hasGeneratedTrips: true,
          lastTripsGeneration: new Date().toISOString(),
        });

        setUserPreferences((prev) =>
          prev
            ? {
                ...prev,
                hasGeneratedTrips: true,
                lastTripsGeneration: new Date().toISOString(),
              }
            : null
        );

        setRecommendedTripsState({
          trips: validTrips,
          status: "success",
          error: null,
          lastFetched: new Date(),
        });

        if (validTrips.length < 3) {
          console.warn(`Generated only ${validTrips.length} valid trips`);
        }
      } else {
        throw new Error(
          "Unable to generate valid trips. Please try again in a few moments."
        );
      }
    } catch (error) {
      setRecommendedTripsState((prev) => ({
        ...prev,
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate trips. Please try again.",
      }));
    }
  };

  // Type guard to check if a trip is a RecommendedTrip
  const isRecommendedTrip = (
    trip: RecommendedTrip | { id: string }
  ): trip is RecommendedTrip => {
    return (trip as RecommendedTrip).tripPlan !== undefined;
  };

  // Update EmptyTripsState component
  const EmptyTripsState: React.FC<{ onRetry: () => void; theme: any }> = ({
    onRetry,
    theme,
  }) => (
    <View style={styles.dontLikeButtonContainer}>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.dontLikeButton,
          {
            borderColor: theme.alternate,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <Ionicons
          name="add-circle-outline"
          size={40}
          color={theme.alternate}
          style={styles.createTripIcon}
        />
        <Text style={[styles.dontLikeButtonText, { color: theme.alternate }]}>
          Generate New{"\n"}Adventures
        </Text>
      </Pressable>
    </View>
  );

  // Add ErrorTripsState component
  const ErrorTripsState: React.FC<{
    onRetry: () => void;
    theme: any;
    error: string;
  }> = ({ onRetry, theme, error }) => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateContent}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={theme.error || "#F44336"}
          style={styles.emptyStateIcon}
        />
        <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
          Oops! Something Went Wrong
        </Text>
        <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
          {error || "We couldn't generate your trips. Please try again."}
        </Text>
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: theme.error || "#F44336" },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <View style={styles.generateButtonContent}>
            <Ionicons
              name="refresh-outline"
              size={20}
              color="white"
              style={styles.generateButtonIcon}
            />
            <Text style={styles.generateButtonText}>Try Again</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );

  // Update resetStorageForTesting to handle the new preferences system
  const resetStorageForTesting = async () => {
    setTapCount((prev) => prev + 1);

    if (tapCount >= 7) {
      setTapCount(0);
      try {
        const user = getAuth().currentUser;
        if (!user) throw new Error("User not authenticated");

        await clearUserPreferences();
        console.log("🧹 User preferences cleared for testing!");

        const preferences = await getUserPreferences(user.uid);
        setUserPreferences(preferences);
        setIsFirstLogin(!preferences.hasCompletedOnboarding);

        loadExistingTrips();

        Alert.alert(
          "Preferences Reset",
          "User preferences have been cleared for testing. The app will treat this as a new login.",
          [{ text: "OK" }]
        );
      } catch (error) {
        console.error("Error resetting preferences:", error);
      }
    }
  };

  return (
    <View
      testID="home-screen"
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <ScrollView
        testID="home-scroll-view"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text
              testID="home-greeting"
              style={[
                styles.greetingText,
                {
                  fontSize: getGreeting().fontSize,
                  color: currentTheme.textPrimary,
                },
              ]}
              onPress={resetStorageForTesting}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {getGreeting().text}
            </Text>
            <Pressable
              onPress={() => navigation.navigate("Notifications")}
              style={({ pressed }) => [
                styles.notificationButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={32}
                color={currentTheme.textPrimary}
              />
              {hasNotifications && (
                <View
                  style={[
                    styles.notificationDot,
                    { backgroundColor: currentTheme.error || "#FF3B30" },
                  ]}
                />
              )}
            </Pressable>
          </View>
          <Text
            style={[
              styles.subGreetingText,
              { color: currentTheme.textSecondary },
            ]}
          >
            Let's plan your next adventure!
          </Text>
        </View>

        <View style={styles.contentContainer}>
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
                      photoRef: photoReference ?? undefined,
                      url: details.url,
                      place_id: details.place_id,
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

          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}
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
                    backgroundColor: currentTheme.shadowBackground,
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

          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}
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
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedTripsContent}
              data={[0, 1, 2]}
              keyExtractor={(index) => `skeleton-${index}`}
              renderItem={({ item: index }) => (
                <RecommendedTripSkeleton
                  key={index}
                  loadingProgress={
                    loadingProgress.currentTripIndex === index
                      ? loadingProgress.completed % 1
                      : loadingProgress.tripStatuses[index] === "completed"
                      ? 1
                      : 0
                  }
                  isFirstCard={index === 0}
                  status={loadingProgress.tripStatuses[index]}
                  currentlyGenerating={
                    loadingProgress.currentTripIndex === index
                  }
                  tripNumber={index + 1}
                />
              )}
            />
          ) : recommendedTripsState.status === "error" ? (
            <ErrorTripsState
              onRetry={handleRefresh}
              theme={currentTheme}
              error={recommendedTripsState.error || ""}
            />
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
                  return (
                    <Pressable
                      testID={`trip-card-${trip.id}`}
                      onPress={() => {
                        navigation.navigate("RecommendedTripDetails", {
                          trip: JSON.stringify(trip.tripPlan),
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
                            {trip.description}
                          </Text>
                          {trip.tripPlan.travelPlan.dates && (
                            <View style={styles.tripDatesContainer}>
                              <Ionicons
                                name="calendar-outline"
                                size={14}
                                color={currentTheme.textSecondary}
                                style={styles.tripDateIcon}
                              />
                              <Text
                                testID={`trip-dates-${trip.id}`}
                                style={[
                                  styles.tripDates,
                                  { color: currentTheme.textSecondary },
                                ]}
                              >
                                {new Date(
                                  trip.tripPlan.travelPlan.dates.startDate
                                ).toLocaleDateString()}{" "}
                                -{" "}
                                {new Date(
                                  trip.tripPlan.travelPlan.dates.endDate
                                ).toLocaleDateString()}
                              </Text>
                            </View>
                          )}
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
    flex: 1,
  },
  subGreetingText: {
    fontSize: 18,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
    marginTop: 8,
  },
  contentContainer: {
    padding: 20,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchIcon: {
    position: "absolute",
    left: 15,
    top: 15,
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  popularDestinationContainer: {
    marginRight: 15,
    padding: 20,
    borderRadius: 15,
    width: width * 0.35,
    height: width * 0.35,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
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
  notificationButton: {
    padding: 8,
    position: "relative",
    marginLeft: 16,
  },
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "white",
  },
  spinningIcon: {
    transform: [{ rotate: "45deg" }],
  },
  dontLikeButtonContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: width * 0.6,
    height: width * 0.8,
    marginRight: 20,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
  dontLikeButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 2,
    borderStyle: "dashed",
    padding: 20,
  },
  dontLikeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
    marginTop: 10,
    lineHeight: 24,
  },
  createTripIcon: {
    marginBottom: 15,
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
    height: width * 0.8,
  },
  emptyStateContent: {
    alignItems: "center",
    maxWidth: 300,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  generateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 200,
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
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 200,
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
  generateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  generateButtonIcon: {
    marginRight: 8,
  },
  generateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  recommendedTripsContent: {
    paddingRight: 20,
    paddingTop: 10,
  },
  tripDatesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  tripDateIcon: {
    marginRight: 4,
  },
  tripDates: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
});

export default Home;
