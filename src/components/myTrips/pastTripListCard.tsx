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
import { useTheme } from "../../context/themeContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/appNav";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TripDetails"
>;

interface SimpleTripData {
  tripData: any;
  tripPlan: any;
  id: string;
}

interface PastTripListCardProps {
  trip: SimpleTripData;
}

const PastTripListCard: React.FC<PastTripListCardProps> = ({ trip }) => {
  const { currentTheme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
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

  const formatData = (data: string) => {
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error("Error parsing data:", error);
        return {};
      }
    }
    return data;
  };

  const tripData = formatData(trip.tripData);
  const tripPlan = formatData(trip.tripPlan);
  const endDate = tripData.endDate ? moment(tripData.endDate) : null;

  // Only display the trip if the end date is in the past
  if (endDate && endDate.isBefore(moment(), "day")) {
    const daysFromToday = moment().diff(endDate, "days");
    return (
      <Animated.View
        style={[styles.container, { transform: [{ scale: scaleAnim }] }]}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => {
            navigation.navigate("PastTripDetails", {
              trip: JSON.stringify({
                ...tripData,
                travelPlan: tripPlan?.travelPlan || {},
              }),
              photoRef:
                tripData?.locationInfo?.photoRef || tripData.photoRef || "",
              docId: trip.id,
            });
          }}
          style={[
            styles.cardContainer,
            { backgroundColor: currentTheme.shadowBackground },
          ]}
        >
          <Image
            source={{
              uri:
                tripData.photoRef || tripData.locationInfo?.photoRef
                  ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${
                      tripData.photoRef || tripData.locationInfo?.photoRef
                      // @ts-ignore
                    }&key=${process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY}`
                  : "https://via.placeholder.com/100",
            }}
            style={styles.image}
          />
          <View style={styles.contentContainer}>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.destinationText,
                  { color: currentTheme.textPrimary },
                ]}
              >
                {tripPlan.travelPlan?.destination || "No Location Available"}
              </Text>
              <View style={styles.daysContainer}>
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={18}
                  color={currentTheme.textSecondary}
                />
                <Text
                  style={[
                    styles.daysText,
                    { color: currentTheme.textSecondary },
                  ]}
                >
                  {`${daysFromToday} days ago`}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={currentTheme.textSecondary}
            />
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // If no past trips, display nothing
  return null;
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 6,
  },
  cardContainer: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    padding: 12,
    alignItems: "center",
    gap: 15,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  destinationText: {
    fontSize: 18,
    fontWeight: "600",
  },
  daysContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  daysText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default PastTripListCard;
