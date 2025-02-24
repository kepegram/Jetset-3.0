import {
  View,
  Text,
  Image,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
  Pressable,
  StatusBar,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useTheme } from "../../../../context/themeContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/appNav";
import { useNavigation, useRoute } from "@react-navigation/native";
import { doc, deleteDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../../../../firebase.config";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import PlannedTrip from "../../../../components/tripDetails/plannedTrip";

const { height } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PastTripDetails"
>;

interface RouteParams {
  trip: string;
  photoRef: string;
  docId: string;
}

const PastTripDetails: React.FC = () => {
  const { currentTheme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { trip, photoRef, docId } = route.params as RouteParams;

  const [tripDetails, setTripDetails] = useState<any>(null);
  const user = FIREBASE_AUTH.currentUser;

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

    try {
      const parsedTrip = JSON.parse(trip);
      setTripDetails(parsedTrip);
    } catch (error) {
      console.error("Error parsing trip details:", error);
    }
  }, [trip, navigation]);

  const deleteTrip = async (tripId: string) => {
    try {
      Alert.alert("Delete Trip", "Are you sure you want to delete this trip?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            const tripDocRef = doc(
              FIREBASE_DB,
              `users/${user.uid}/userTrips/${tripId}`
            );
            await deleteDoc(tripDocRef);
            console.log(`Trip with ID ${tripId} deleted successfully.`);
            navigation.navigate("MyTripsMain");
          },
        },
      ]);
    } catch (error) {
      console.error("Failed to delete trip:", error);
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
        <Ionicons name="airplane" size={50} color={currentTheme.alternate} />
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
            uri:
              photoRef || tripDetails?.photoRef
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${
                    photoRef || tripDetails?.photoRef
                    // @ts-ignore
                  }&key=${process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY}`
                : "https://via.placeholder.com/800",
          }}
          style={styles.image}
        />
      </View>

      <ScrollView
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
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.destinationTitle,
                  { color: currentTheme.textPrimary },
                ]}
              >
                {tripDetails?.travelPlan?.destination || "Unknown Location"}
              </Text>
              <Pressable onPress={() => deleteTrip(docId)}>
                <Ionicons
                  name="trash-bin-outline"
                  size={24}
                  color={currentTheme.textSecondary}
                />
              </Pressable>
            </View>
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
              <Text
                style={[
                  styles.tripMetaText,
                  { color: currentTheme.textPrimary },
                ]}
              >
                {moment(tripDetails?.startDate).format("MMM DD")} -{" "}
                {moment(tripDetails?.endDate).format("MMM DD")}
              </Text>
            </View>
            <View
              style={[
                styles.tripMetaItem,
                { backgroundColor: `${currentTheme.alternate}20` },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={22}
                color={currentTheme.alternate}
              />
              <Text
                style={[
                  styles.tripMetaText,
                  { color: currentTheme.textPrimary },
                ]}
              >
                {tripDetails?.whoIsGoing || "Unknown"}
              </Text>
            </View>
          </View>

          <PlannedTrip details={tripDetails?.travelPlan} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
  scrollContent: {
    marginTop: height * 0.45,
  },
  contentContainer: {
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  headerContainer: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  destinationTitle: {
    fontSize: 32,
    fontFamily: "outfit-bold",
    letterSpacing: 0.5,
  },
  tripMetaContainer: {
    flexDirection: "row",
    marginBottom: 25,
    gap: 15,
  },
  tripMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tripMetaText: {
    fontFamily: "outfit-medium",
    fontSize: 16,
    marginLeft: 8,
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
});

export default PastTripDetails;
