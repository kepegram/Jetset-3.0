import React, {
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  Image,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { CreateTripContext } from "../../../../context/createTripContext";
import { AI_PROMPT, PLACE_AI_PROMPT } from "../../../../api/ai-prompt";
import { chatSession } from "../../../../api/AI-Model";
import { doc, setDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../../../../firebase.config";
import { useTheme } from "../../../../context/themeContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/appNav";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPhotoReference } from "../../../../api/places-api";
import * as Progress from "react-native-progress";
import moment from "moment";
import { useTrip } from "../../../../context/createTripContext";

type GenerateTripScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "GenerateTrip"
>;

interface TripResponse {
  travelPlan: {
    destination?: string;
    [key: string]: any;
  };
}

const GenerateTrip: React.FC = () => {
  const { currentTheme } = useTheme();
  const navigation = useNavigation<GenerateTripScreenNavigationProp>();
  const { tripData, setTripData } = useTrip();
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing your trip...");

  const user = FIREBASE_AUTH.currentUser;

  const totalDays = tripData.totalNoOfDays || 0;
  const whoIsGoing =
    typeof tripData.whoIsGoing === "string" ? tripData.whoIsGoing : "";

  // Construct the final AI prompt based on trip data
  const getFinalPrompt = () => {
    let FINAL_PROMPT;

    // Choose prompt template based on destination type
    if (tripData?.destinationType) {
      FINAL_PROMPT = AI_PROMPT.replace(
        "{destinationType}",
        tripData.destinationType
      );
    } else {
      FINAL_PROMPT = PLACE_AI_PROMPT.replace(
        "{name}",
        tripData.locationInfo?.name || ""
      );
    }

    // Replace placeholders with actual trip data
    FINAL_PROMPT = FINAL_PROMPT.replace("{totalDays}", totalDays.toString())
      .replace("{totalNight}", (totalDays - 1).toString() || "0")
      .replace("{whoIsGoing}", whoIsGoing)
      .replace("{budget}", tripData.budget?.toString() || "")
      .replace("{activityLevel}", tripData.activityLevel || "");

    return FINAL_PROMPT;
  };

  // Add this function to update progress and status
  const updateProgress = (newProgress: number, status: string) => {
    setProgress(newProgress);
    setStatusText(status);
  };

  // Modify generateAiTrip to include progress updates
  const generateAiTrip = async (retryCount = 0): Promise<void> => {
    if (!user?.uid) {
      Alert.alert("Error", "You must be logged in to generate a trip");
      return;
    }

    setLoading(true);
    updateProgress(0.1, "Preparing your travel preferences...");
    const finalPrompt = getFinalPrompt();

    try {
      updateProgress(0.3, "Consulting our AI travel expert...");
      const result = await chatSession.sendMessage(finalPrompt);
      updateProgress(0.5, "Creating your personalized itinerary...");
      const responseText = await result.response.text();
      const tripResp = parseAIResponse(responseText);

      updateProgress(0.7, "Finding the perfect photos for your destination...");
      let photoRef = null;
      if (!tripData?.destinationType) {
        const placeId = tripData.locationInfo?.place_id;
        if (!placeId) {
          console.error("No place_id found");
          return;
        }
        try {
          photoRef = await getPhotoReference(placeId);
        } catch (error) {
          console.error("Error fetching photo reference:", error);
        }
      } else {
        // For AI-generated destination trips, get photo reference for the generated destination
        try {
          const destination = tripResp.travelPlan.destination;
          if (destination) {
            // First, get the placeId for the destination
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
                destination
              )}&inputtype=textquery&key=${
                // @ts-ignore - Environment variable access
                process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY
              }`
            );
            const data = await response.json();

            if (data.candidates && data.candidates[0]?.place_id) {
              photoRef = await getPhotoReference(data.candidates[0].place_id);
            }
          }
        } catch (error) {
          console.error(
            "Error fetching photo reference for AI destination:",
            error
          );
        }
      }

      updateProgress(0.9, "Saving your trip details...");
      await saveTripToFirestore(tripResp, photoRef);

      updateProgress(1, "Trip successfully generated!");
      await AsyncStorage.clear();
      navigation.navigate("MyTripsMain");
    } catch (error) {
      handleGenerationError(error, retryCount);
    }
  };

  const debugTripData = () => {
    console.log("Current Trip Data:", JSON.stringify(tripData, null, 2));
  };

  const debugAIPrompt = () => {
    const prompt = getFinalPrompt();
    console.log("AI Prompt after replacements:", prompt);
  };

  const parseAIResponse = (responseText: string): TripResponse => {
    console.log("Raw AI Response:", responseText);
    const cleanedResponse = cleanJsonResponse(responseText);
    console.log("Cleaned Response:", cleanedResponse);
    try {
      const parsed = JSON.parse(cleanedResponse);
      if (!parsed?.travelPlan) {
        throw new Error("Invalid AI response format");
      }
      return parsed;
    } catch (error) {
      console.error("JSON parsing error:", error);
      console.error("Failed response:", cleanedResponse);
      throw new Error("Failed to parse AI response");
    }
  };

  const cleanJsonResponse = (response: string): string => {
    let cleanedResponse = response.trim();

    // Remove any text before the first {
    const firstBrace = cleanedResponse.indexOf("{");
    if (firstBrace !== -1) {
      cleanedResponse = cleanedResponse.substring(firstBrace);
    }

    // Remove any text after the last }
    const lastBrace = cleanedResponse.lastIndexOf("}");
    if (lastBrace !== -1) {
      cleanedResponse = cleanedResponse.substring(0, lastBrace + 1);
    }

    // Fix common JSON issues without escaping quotes
    cleanedResponse = cleanedResponse
      .replace(/\n/g, " ") // Replace newlines with spaces
      .replace(/,\s*}/g, "}") // Remove trailing commas
      .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
      .replace(/"https":\/{2}/g, '"https://') // Fix broken https URLs
      .replace(/"http":\/{2}/g, '"http://') // Fix broken http URLs
      .replace(/"https"\s*:\s*\/\//g, '"https://') // Fix another variant of broken https URLs
      .replace(/"http"\s*:\s*\/\//g, '"http://') // Fix another variant of broken http URLs
      .replace(/Day\s*"(\d+)"/g, "Day $1") // Fix day numbering format
      .replace(/Day\s+"(\d+)"\s*:/g, "Day $1:") // Fix day numbering format in keys
      .replace(/"\s+"/g, '" "') // Fix spaces between quotes
      .replace(/([^"]):\/\//g, "$1://") // Fix any remaining broken URLs
      .replace(/([a-zA-Z0-9])":/g, '$1":') // Ensure proper spacing before colons
      .replace(/:\s*"([^"]*)":\/{2}/g, ':"$1://'); // Fix URLs in values

    // Try to parse the JSON to see if it's valid
    try {
      return JSON.stringify(JSON.parse(cleanedResponse));
    } catch (error) {
      // If parsing fails, try more aggressive fixes
      cleanedResponse = cleanedResponse
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":') // Ensure property names are quoted
        .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double quotes
        .replace(/([^"]):\/\//g, "$1://") // One more pass at fixing URLs
        .replace(/:\s*"([^"]*)":\/{2}/g, ':"$1://'); // One more pass at fixing URLs in values

      try {
        return JSON.stringify(JSON.parse(cleanedResponse));
      } catch (error) {
        // Return the cleaned response anyway, even though it might not parse
        return cleanedResponse;
      }
    }
  };

  const saveTripToFirestore = async (
    tripResp: TripResponse,
    photoRef: string | null
  ) => {
    const timestamp = Date.now().toString();
    const startDateStr = tripData.startDate
      ? moment(tripData.startDate).format("YYYY-MM-DD")
      : "";
    const endDateStr = tripData.endDate
      ? moment(tripData.endDate).format("YYYY-MM-DD")
      : "";
    const today = moment().startOf("day");

    // Determine status prefix for the document ID
    let statusPrefix;
    if (startDateStr && endDateStr) {
      const startDate = moment(startDateStr);
      const endDate = moment(endDateStr);
      if (startDate.isAfter(today)) {
        statusPrefix = "up";
      } else if (endDate.isBefore(today)) {
        statusPrefix = "past";
      } else {
        statusPrefix = "cur";
      }
    }

    // Create document ID with status prefix
    const docId = `${statusPrefix}_${timestamp}`;

    // Create a document reference using the new path structure
    const tripDocRef = doc(
      FIREBASE_DB,
      `users/${user?.uid || "unknown"}/userTrips/${docId}`
    );

    // Clean the tripData object to remove undefined values
    const cleanTripData = Object.fromEntries(
      Object.entries({
        ...tripData,
        startDate: startDateStr,
        endDate: endDateStr,
        preSelectedDestination: tripData.preSelectedDestination || null,
      }).filter(([_, value]) => value !== undefined)
    );

    await setDoc(tripDocRef, {
      userEmail: user?.email || "unknown",
      tripPlan: tripResp,
      tripData: cleanTripData,
      photoRef: photoRef,
      docId,
      createdAt: new Date().toISOString(),
    });
  };

  const handleGenerationError = (error: any, retryCount: number) => {
    console.error("AI generation failed:", error.message);
    if (retryCount < 3 && isMounted.current) {
      const waitTime = Math.pow(2, retryCount) * 1000;
      console.log(`Retrying in ${waitTime / 1000} seconds...`);
      setTimeout(() => {
        if (isMounted.current) {
          generateAiTrip(retryCount + 1);
        }
      }, waitTime);
    } else {
      Alert.alert(
        "Error",
        "An error occurred while generating your trip. Please try again later.",
        [
          {
            text: "OK",
            onPress: () => {
              setTripData({});
              navigation.navigate("MyTripsMain");
            },
          },
        ]
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      isMounted.current = true;
      return () => {
        isMounted.current = false;
      };
    }, [])
  );

  // Start generating trip when screen loads
  useEffect(() => {
    if (!loading) {
      generateAiTrip();
    }
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.gradient}>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: currentTheme.textPrimary }]}>
            Creating Your Perfect Trip
          </Text>

          <Text
            style={[styles.subtitle, { color: currentTheme.textSecondary }]}
          >
            Our AI is crafting a personalized itinerary just for you...
          </Text>

          <Image
            source={require("../../../../assets/app-imgs/plane.gif")}
            style={styles.animation}
          />

          <View style={styles.progressContainer}>
            <Progress.Bar
              progress={progress}
              width={300}
              height={8}
              color={currentTheme.primary}
              unfilledColor={currentTheme.secondary}
              borderWidth={0}
              animated={true}
            />

            <Text
              style={[styles.statusText, { color: currentTheme.textSecondary }]}
            >
              {statusText}
            </Text>

            <View style={styles.loadingIndicator}>
              <ActivityIndicator color={currentTheme.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { color: currentTheme.textSecondary },
                ]}
              >
                {Math.round(progress * 100)}% Complete
              </Text>
            </View>
          </View>

          <Text style={[styles.warning, { color: currentTheme.textSecondary }]}>
            This may take a few moments. Please don't close the app.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  title: {
    fontSize: 28,
    fontFamily: "outfit-bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "outfit",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  animation: {
    width: "100%",
    height: 220,
    resizeMode: "contain",
    marginBottom: 20,
  },
  warning: {
    fontSize: 14,
    fontFamily: "outfit",
    textAlign: "center",
    opacity: 0.8,
    paddingHorizontal: 30,
    marginTop: 20,
  },
  progressContainer: {
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  statusText: {
    marginTop: 15,
    fontSize: 16,
    fontFamily: "outfit-medium",
    textAlign: "center",
  },
  loadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "outfit",
  },
});

export default GenerateTrip;
