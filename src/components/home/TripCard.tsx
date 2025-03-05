import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { RecommendedTrip } from "../../types/home.types";
import { Theme } from "../../context/themeContext";

interface TripCardProps {
  trip: RecommendedTrip;
  onPress: () => void;
  theme: Theme;
}

export const TripCard: React.FC<TripCardProps> = React.memo(
  ({ trip, onPress, theme }) => {
    return (
      <Pressable
        testID={`trip-card-${trip.id}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            transform: [{ scale: pressed ? 0.98 : 1 }],
            backgroundColor: theme.shadowBackground,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${trip.name}`}
      >
        {trip.photoRef && (
          <View style={styles.imageContainer}>
            <Image
              testID={`trip-image-${trip.id}`}
              source={{
                uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${trip.photoRef}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY}`,
              }}
              style={styles.image}
              accessibilityRole="image"
              accessibilityLabel={`Photo of ${trip.name}`}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.gradient}
            />
          </View>
        )}
        <View style={styles.infoContainer}>
          <Ionicons
            name="location-outline"
            size={20}
            color={theme.textPrimary}
            style={styles.locationIcon}
          />
          <View style={styles.textContainer}>
            <Text
              testID={`trip-name-${trip.id}`}
              style={[styles.name, { color: theme.textPrimary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {trip.name}
            </Text>
            <Text
              testID={`trip-description-${trip.id}`}
              style={[styles.description, { color: theme.textSecondary }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {trip.description}
            </Text>
            {trip.tripPlan.travelPlan.dates && (
              <View style={styles.datesContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={theme.textSecondary}
                  style={styles.dateIcon}
                />
                <Text
                  testID={`trip-dates-${trip.id}`}
                  style={[styles.dates, { color: theme.textSecondary }]}
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
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    marginRight: 20,
    width: 300,
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
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 15,
  },
  locationIcon: {
    marginRight: 8,
    marginTop: 3,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  description: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  datesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  dateIcon: {
    marginRight: 4,
  },
  dates: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
});

export default TripCard;
