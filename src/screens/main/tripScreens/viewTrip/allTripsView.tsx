import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  SafeAreaView,
  Pressable,
  Image,
} from "react-native";
import { useTheme } from "../../../../context/themeContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import PastTripListCard from "../../../../components/myTrips/pastTripListCard";
import moment from "moment";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/appNav";

const { width } = Dimensions.get("window");

type RouteParams = {
  trips: string;
  type: "current" | "upcoming" | "past";
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AllTripsView: React.FC = () => {
  const { currentTheme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { trips, type } = route.params as RouteParams;

  const parsedTrips = JSON.parse(trips);

  const getTitleByType = () => {
    switch (type) {
      case "current":
        return "Current Trips";
      case "upcoming":
        return "Upcoming Trips";
      case "past":
        return "Past Trips";
      default:
        return "All Trips";
    }
  };

  const sortTrips = () => {
    return parsedTrips.sort((a: any, b: any) => {
      const dateA = moment(a.tripData.startDate);
      const dateB = moment(b.tripData.startDate);
      return type === "past" ? dateB.diff(dateA) : dateA.diff(dateB);
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const tripData =
      typeof item.tripData === "string"
        ? JSON.parse(item.tripData)
        : item.tripData;
    const tripPlan =
      typeof item.tripPlan === "string"
        ? JSON.parse(item.tripPlan)
        : item.tripPlan;

    const startDate = moment(tripData.startDate);
    const today = moment().startOf("day");
    const daysUntil = startDate.diff(today, "days");

    return (
      <Pressable
        onPress={() => {
          navigation.navigate(
            type === "past" ? "PastTripDetails" : "TripDetails",
            {
              trip: JSON.stringify({
                ...tripData,
                travelPlan: tripPlan?.travelPlan || {},
              }),
              photoRef:
                tripData?.photoRef || tripData?.locationInfo?.photoRef || "",
              docId: item.id,
            }
          );
        }}
        style={[styles.tripCard, { backgroundColor: currentTheme.background }]}
      >
        <Image
          source={{
            uri:
              tripData?.photoRef || tripData?.locationInfo?.photoRef
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${
                    tripData?.photoRef || tripData?.locationInfo?.photoRef
                  }&key=${process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY}`
                : "https://via.placeholder.com/400",
          }}
          style={styles.tripImage}
        />
        <View style={styles.tripInfo}>
          <Text
            style={[
              styles.destinationText,
              { color: currentTheme.textPrimary },
            ]}
          >
            {tripPlan?.travelPlan?.destination || "Unknown Location"}
          </Text>
          <View style={styles.dateContainer}>
            <Ionicons
              name={type === "past" ? "calendar-outline" : "calendar-outline"}
              size={18}
              color={currentTheme.textSecondary}
            />
            <Text
              style={[styles.dateText, { color: currentTheme.textSecondary }]}
            >
              {type === "past"
                ? `${moment().diff(moment(tripData.endDate), "days")} days ago`
                : `In ${daysUntil} days`}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={24}
          color={currentTheme.textSecondary}
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={currentTheme.textPrimary}
          />
        </Pressable>
        <Text style={[styles.title, { color: currentTheme.textPrimary }]}>
          {getTitleByType()}
        </Text>
      </View>

      <FlatList
        data={sortTrips()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text
              style={[styles.emptyText, { color: currentTheme.textSecondary }]}
            >
              No trips found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: 24,
    fontFamily: "outfit-bold",
  },
  tripCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    gap: 12,
  },
  tripImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  tripInfo: {
    flex: 1,
    gap: 6,
  },
  destinationText: {
    fontSize: 18,
    fontFamily: "outfit-bold",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontFamily: "outfit-medium",
  },
  separator: {
    height: 12,
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "outfit-medium",
  },
});

export default AllTripsView;
