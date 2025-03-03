import {
  View,
  Text,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
  Pressable,
  StatusBar,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useTheme } from "../../../context/themeContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/appNav";
import { useNavigation, useRoute } from "@react-navigation/native";
import HotelList from "../../../components/tripDetails/hotelList";
import PlannedTrip from "../../../components/tripDetails/plannedTrip";
import { MainButton } from "../../../components/ui/button";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../../../firebase.config";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { travelOptions } from "../tripScreens/buildTrip/whosGoing";
import moment from "moment";

const { width, height } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "RecommendedTripDetails"
>;

interface RouteParams {
  trip: string;
  photoRef: string;
}

const RecommendedTripDetails: React.FC = () => {
  const { currentTheme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { trip, photoRef } = route.params as RouteParams;
  const user = FIREBASE_AUTH.currentUser;

  const [tripDetails, setTripDetails] = useState<any>(null);
  const randomTravelOption =
    travelOptions[Math.floor(Math.random() * travelOptions.length)];

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "",
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </Pressable>
      ),
    });
  }, [navigation, currentTheme.background]);

  const adjustDateToCurrentYear = (dateString: string) => {
    const date = new Date(dateString);
    const currentYear = new Date().getFullYear();
    date.setFullYear(currentYear);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    try {
      const parsedTrip = JSON.parse(trip);

      // Adjust dates to current year if they exist
      if (parsedTrip?.travelPlan?.dates) {
        parsedTrip.travelPlan.dates.startDate = adjustDateToCurrentYear(
          parsedTrip.travelPlan.dates.startDate
        );
        parsedTrip.travelPlan.dates.endDate = adjustDateToCurrentYear(
          parsedTrip.travelPlan.dates.endDate
        );
      }

      setTripDetails(parsedTrip);
    } catch (error) {
      console.error("Error parsing trip details:", error);
    }
  }, [trip]);

  const saveTrip = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "You must be logged in to save a trip");
      return;
    }

    try {
      const timestamp = Date.now().toString();
      const startDate = moment(tripDetails?.travelPlan?.dates?.startDate);
      const endDate = moment(tripDetails?.travelPlan?.dates?.endDate);
      const today = moment().startOf("day");

      // Determine status prefix for the document ID
      let statusPrefix;
      if (startDate.isAfter(today)) {
        statusPrefix = "up";
      } else if (endDate.isBefore(today)) {
        statusPrefix = "past";
      } else {
        statusPrefix = "cur";
      }

      // Create document ID with status prefix
      const docId = `${statusPrefix}_${timestamp}`;

      // Create a tripData object that matches the structure of regular trips
      const tripData = {
        startDate: tripDetails?.travelPlan?.dates?.startDate || null,
        endDate: tripDetails?.travelPlan?.dates?.endDate || null,
        totalNoOfDays: tripDetails?.travelPlan?.numberOfDays || 5,
        budget: tripDetails?.travelPlan?.budget || "average",
        activityLevel: "moderate",
        whoIsGoing: randomTravelOption.label,
        locationInfo: {
          name: tripDetails?.travelPlan?.destination || "",
          photoRef: photoRef || null,
        },
      };

      // Ensure dates are in current year before saving
      if (tripData.startDate) {
        tripData.startDate = adjustDateToCurrentYear(tripData.startDate);
      }
      if (tripData.endDate) {
        tripData.endDate = adjustDateToCurrentYear(tripData.endDate);
      }

      // Create a document reference using the new path structure
      const tripDocRef = doc(
        FIREBASE_DB,
        `users/${user.uid}/userTrips/${docId}`
      );

      // Save to userTrips with the same structure as regular trips
      await setDoc(tripDocRef, {
        userEmail: user.email || "unknown",
        tripPlan: {
          ...tripDetails,
          travelPlan: {
            ...tripDetails.travelPlan,
            dates: {
              startDate: tripData.startDate,
              endDate: tripData.endDate,
              bestTimeToVisit: tripDetails?.travelPlan?.dates?.bestTimeToVisit,
            },
          },
        },
        tripData: tripData,
        photoRef: photoRef,
        docId,
        createdAt: new Date().toISOString(),
      });

      // Delete from suggestedTrips
      const suggestedTripsCollection = collection(
        FIREBASE_DB,
        `users/${user.uid}/suggestedTrips`
      );

      // Query to find the matching trip in suggestedTrips by destination
      const q = query(
        suggestedTripsCollection,
        where("name", "==", tripDetails?.travelPlan?.destination)
      );

      const querySnapshot = await getDocs(q);

      // Delete the matching trip
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(suggestedTripsCollection, document.id));
      });

      Alert.alert("Success", "Trip saved successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error saving trip:", error);
      Alert.alert("Error", "Failed to save trip. Please try again.");
    }
  };

  if (!tripDetails) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: currentTheme.background },
        ]}
      >
        <MaterialCommunityIcons
          name="airplane-clock"
          size={50}
          color={currentTheme.alternate}
        />
        <Text style={[styles.loadingText, { color: currentTheme.textPrimary }]}>
          Loading trip details...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: photoRef
              ? // @ts-ignore
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY}`
              : "https://via.placeholder.com/800",
          }}
          style={styles.image}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.contentContainer,
            { backgroundColor: currentTheme.background },
          ]}
        >
          <View style={styles.headerContainer}>
            <Text
              style={[
                styles.destinationTitle,
                { color: currentTheme.textPrimary },
              ]}
            >
              {tripDetails?.travelPlan?.destination || "Unknown Location"}
            </Text>
          </View>

          <View style={styles.tripMetaContainer}>
            <View
              style={[
                styles.tripMetaItem,
                { backgroundColor: `${currentTheme.alternate}20` },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color={currentTheme.alternate}
              />
              {tripDetails?.travelPlan?.dates ? (
                <Text
                  style={[
                    styles.tripMetaText,
                    { color: currentTheme.textPrimary },
                  ]}
                >
                  {new Date(
                    tripDetails.travelPlan.dates.startDate
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(
                    tripDetails.travelPlan.dates.endDate
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.tripMetaText,
                    { color: currentTheme.textPrimary },
                  ]}
                >
                  {tripDetails?.travelPlan?.numberOfDays} days
                </Text>
              )}
            </View>
            <View
              style={[
                styles.tripMetaItem,
                { backgroundColor: `${currentTheme.alternate}20` },
              ]}
            >
              <Ionicons
                name={randomTravelOption.icon as any}
                size={22}
                color={currentTheme.alternate}
              />
              <Text
                style={[
                  styles.tripMetaText,
                  { color: currentTheme.textPrimary },
                ]}
              >
                {randomTravelOption.label}
              </Text>
            </View>
          </View>

          <View style={styles.flightInfoContainer}>
            <View
              style={[
                styles.flightContainer,
                { backgroundColor: currentTheme.accentBackground },
              ]}
            >
              <View style={styles.flightInfo}>
                <View style={styles.airlineWrapper}>
                  <Text
                    style={[
                      styles.airlineName,
                      { color: currentTheme.textPrimary },
                    ]}
                  >
                    {tripDetails?.travelPlan?.flights?.airlineName ||
                      "Unknown Airline"}
                  </Text>
                </View>
                <View style={styles.priceWrapper}>
                  <Text
                    style={[
                      styles.priceLabel,
                      { color: currentTheme.textSecondary },
                    ]}
                  >
                    Approximate Price
                  </Text>
                  <Text
                    style={[styles.price, { color: currentTheme.alternate }]}
                  >
                    ~${tripDetails?.travelPlan?.flights?.flightPrice || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <HotelList hotelList={tripDetails?.travelPlan?.hotels} />
          <PlannedTrip details={tripDetails?.travelPlan} />
        </View>
      </ScrollView>

      <View
        style={[styles.bottomBar, { backgroundColor: currentTheme.background }]}
      >
        <MainButton
          onPress={saveTrip}
          buttonText="Save Trip"
          width="100%"
          style={[styles.saveButton]}
        />
      </View>
    </View>
  );
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingText: {
    fontFamily: "outfit-medium",
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: height * 0.45,
    flex: 1,
  },
  headerContainer: {
    marginBottom: 20,
  },
  destinationTitle: {
    fontSize: 32,
    fontFamily: "outfit-bold",
    letterSpacing: 0.5,
  },
  tripMetaContainer: {
    flexDirection: "column",
    marginBottom: 25,
    gap: 10,
  },
  tripMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexWrap: "wrap",
  },
  tripMetaText: {
    fontFamily: "outfit-medium",
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  flightInfoContainer: {
    marginBottom: 25,
  },
  flightContainer: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  flightInfo: {
    gap: 8,
  },
  airlineWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  airlineName: {
    fontFamily: "outfit-bold",
    fontSize: 18,
  },
  priceWrapper: {
    gap: 2,
  },
  priceLabel: {
    fontFamily: "outfit",
    fontSize: 14,
  },
  price: {
    fontFamily: "outfit-bold",
    fontSize: 24,
  },
  saveButton: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.3)",
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  overlayTitle: {
    fontSize: 24,
    fontFamily: "outfit-bold",
    color: "white",
  },
});

export default RecommendedTripDetails;
