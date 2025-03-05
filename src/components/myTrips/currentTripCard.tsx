import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import React, { useEffect, useState } from "react";
import moment from "moment";
import { useTheme } from "../../context/themeContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/appNav";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Trip, TripData, TripPlan } from "../../types/trip";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CurrentTripDetails"
>;

interface SimpleTripData {
  tripData: TripData;
  tripPlan: TripPlan;
  id: string;
  docId: string;
  subcollection: string;
}

interface CurrentTripsCardProps {
  userTrips: SimpleTripData[];
}

const CurrentTripsCard: React.FC<CurrentTripsCardProps> = ({ userTrips }) => {
  const { currentTheme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [currentTrip, setCurrentTrip] = useState<SimpleTripData | null>(null);
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const today = moment().startOf("day");

    const findCurrentTrip = userTrips?.find((trip) => {
      const tripData = parseData(trip.tripData);
      const startDate = moment(tripData.startDate).startOf("day");
      const endDate = moment(tripData.endDate).endOf("day");
      return startDate.isSameOrBefore(today) && endDate.isSameOrAfter(today);
    });

    setCurrentTrip(findCurrentTrip || null);
  }, [userTrips]);

  const parseData = (data: TripData | TripPlan | string) => {
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

  if (!currentTrip) {
    return (
      <Animated.View
        style={[styles.container, { transform: [{ scale: scaleAnim }] }]}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => navigation.navigate("WhereTo")}
          style={[
            styles.cardContainer,
            styles.noTripCard,
            { backgroundColor: currentTheme.shadowBackground },
          ]}
        >
          <Image
            source={require("../../assets/app-imgs/placeholder.jpeg")}
            style={styles.image}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradient}
          >
            <View style={styles.contentContainer}>
              <View style={styles.noTripContent}>
                <MaterialIcons name="flight" size={32} color="#fff" />
                <Text style={styles.noTripText}>
                  No current trips. Time to plan your next adventure!
                </Text>
                <View style={styles.createTripButton}>
                  <Text style={styles.createTripText}>Create Trip</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  const parsedCurrentTrip = parseData(currentTrip.tripData);
  const parsedCurrentPlan = parseData(currentTrip.tripPlan);

  const today = moment().startOf("day");
  const endDate = moment(parsedCurrentTrip.endDate).endOf("day");
  const daysRemaining = endDate.diff(today, "days");

  const photoRef =
    parsedCurrentTrip?.locationInfo?.photoRef ||
    parsedCurrentTrip?.photoRef ||
    "";

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: scaleAnim }] }]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          const tripData = {
            ...parsedCurrentTrip,
            travelPlan: parsedCurrentPlan?.travelPlan || {},
            photoRef: photoRef,
          };

          navigation.navigate("CurrentTripDetails", {
            trip: JSON.stringify(tripData),
            photoRef: photoRef,
            docId: currentTrip.docId,
          });
        }}
        style={[
          styles.cardContainer,
          { backgroundColor: currentTheme.shadowBackground },
        ]}
      >
        <Image
          source={
            photoRef
              ? {
                  // @ts-ignore
                  uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY}`,
                }
              : require("../../assets/app-imgs/placeholder.jpeg")
          }
          style={styles.image}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.gradient}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.destinationText}>
              {parsedCurrentPlan?.travelPlan?.destination || "No Location Name"}
            </Text>
            <View style={styles.daysContainer}>
              <MaterialIcons name="timer" size={20} color="#fff" />
              <Text style={styles.daysText}>
                {daysRemaining > 0
                  ? `${daysRemaining} day${
                      daysRemaining !== 1 ? "s" : ""
                    } remaining`
                  : daysRemaining === 0
                  ? "Last day!"
                  : "Trip has ended"}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 10,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: "100%",
    height: 240,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    justifyContent: "flex-end",
    padding: 20,
  },
  contentContainer: {
    gap: 8,
  },
  destinationText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  daysContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  daysText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  noTripCard: {
    height: 240,
  },
  noTripContent: {
    alignItems: "center",
    gap: 12,
  },
  noTripText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  createTripButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  createTripText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CurrentTripsCard;
