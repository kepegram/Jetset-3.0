import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import React from "react";
import moment from "moment";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/appNav";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TripDetails"
>;

interface UpcomingTripsCardProps {
  userTrips: Array<{
    tripData: string;
    tripPlan: string;
    id: string;
  }>;
}

const UpcomingTripsCard: React.FC<UpcomingTripsCardProps> = ({ userTrips }) => {
  const navigation = useNavigation<NavigationProp>();
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  if (!userTrips || userTrips.length === 0) return null;

  const parseData = (data: string) => {
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error("Failed to parse data:", error);
        return {};
      }
    }
    return data;
  };

  const today = moment().startOf("day");

  const sortedTrips = userTrips
    .map((trip) => ({
      ...trip,
      parsedTripData: parseData(trip.tripData),
      parsedTripPlan: parseData(trip.tripPlan),
    }))
    .sort((a, b) => {
      const dateA = moment(a.parsedTripData.startDate);
      const dateB = moment(b.parsedTripData.startDate);
      return dateA.diff(dateB);
    });

  const upcomingTripData = sortedTrips.find((trip) => {
    const startDate = moment(trip.parsedTripData.startDate).startOf("day");
    const endDate = moment(trip.parsedTripData.endDate).endOf("day");
    return startDate.isAfter(today) && endDate.isAfter(today);
  });

  const UpcomingTrip = upcomingTripData?.parsedTripData;
  const UpcomingPlan = upcomingTripData?.parsedTripPlan;

  if (!UpcomingTrip) return null;

  const daysUntilTrip = UpcomingTrip?.startDate
    ? moment(UpcomingTrip.startDate).diff(today, "days")
    : null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: scaleAnim }] }]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          navigation.navigate("TripDetails", {
            trip: JSON.stringify({
              ...UpcomingTrip,
              travelPlan: UpcomingPlan?.travelPlan || {},
            }),
            photoRef:
              UpcomingTrip?.photoRef ||
              UpcomingTrip?.locationInfo?.photoRef ||
              "",
            docId: upcomingTripData?.id,
          });
        }}
        style={styles.cardContainer}
      >
        <Image
          source={{
            uri:
              UpcomingTrip?.photoRef || UpcomingTrip?.locationInfo?.photoRef
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${
                    UpcomingTrip?.photoRef ||
                    UpcomingTrip?.locationInfo?.photoRef
                    // @ts-ignore
                  }&key=${process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY}`
                : "https://via.placeholder.com/400",
          }}
          style={styles.image}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.gradient}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.destinationText}>
              {UpcomingPlan?.travelPlan?.destination || "No Location Name"}
            </Text>
            {daysUntilTrip !== null && (
              <View style={styles.daysContainer}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.daysText}>
                  {daysUntilTrip} days until trip
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: 200,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    justifyContent: "flex-end",
    padding: 15,
  },
  contentContainer: {
    gap: 8,
  },
  destinationText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  daysContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  daysText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
});

export default UpcomingTripsCard;
