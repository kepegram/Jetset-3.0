import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  StatusBar,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { useTheme } from "../../../context/themeContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { CreateTripContext } from "../../../context/createTripContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/appNav";
import MapView, { Marker } from "react-native-maps";
import { MainButton } from "../../../components/ui/button";

const { height } = Dimensions.get("window");

// Interface for route parameters
type RouteParams = {
  destination: {
    name: string;
    description: string;
    image: number;
    bestTimeToVisit: string;
    geoCoordinates?: {
      latitude: number;
      longitude: number;
    };
  };
};

type PopularDestinationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PopularDestinations"
>;

const PopularDestinations: React.FC = () => {
  const { currentTheme } = useTheme();
  const route = useRoute();
  const { tripData = {}, setTripData = () => {} } =
    useContext(CreateTripContext) || {};
  const { destination } = route.params as RouteParams;
  const navigation = useNavigation<PopularDestinationsScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);

  // Configure navigation header
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "",
      // Custom back button with white background
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </Pressable>
      ),
    });
  }, [navigation]);

  // Function to fetch photo reference and URL for the destination
  const fetchDestinationDetails = async () => {
    try {
      setIsLoading(true);

      // First, use Find Place to get the place_id
      const findPlaceResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
          destination.name
        )}&inputtype=textquery&fields=place_id&key=${
          // @ts-ignore - Environment variable access
          process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY
        }`
      );

      const findPlaceData = await findPlaceResponse.json();

      if (findPlaceData.candidates && findPlaceData.candidates.length > 0) {
        const placeId = findPlaceData.candidates[0].place_id;

        // Then, use Place Details to get full details including photos and URL
        const detailsResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos,url,formatted_address,geometry&key=${
            // @ts-ignore - Environment variable access
            process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY
          }`
        );

        const detailsData = await detailsResponse.json();

        if (detailsData.result) {
          const photoReference =
            detailsData.result.photos?.[0]?.photo_reference;
          const placeUrl = detailsData.result.url;

          // Set the destination in tripData with the additional details
          setTripData({
            ...tripData,
            locationInfo: {
              name: destination.name,
              coordinates: destination.geoCoordinates
                ? {
                    lat: destination.geoCoordinates.latitude,
                    lng: destination.geoCoordinates.longitude,
                  }
                : undefined,
              photoRef: photoReference,
              url: placeUrl,
            },
            preSelectedDestination: destination.name,
          });
        }
      }
    } catch (error) {
      // If there's an error, set basic info without photoRef and url
      setTripData({
        ...tripData,
        locationInfo: {
          name: destination.name,
          coordinates: destination.geoCoordinates
            ? {
                lat: destination.geoCoordinates.latitude,
                lng: destination.geoCoordinates.longitude,
              }
            : undefined,
        },
        preSelectedDestination: destination.name,
      });
    } finally {
      // Navigate to WhereTo screen
      // @ts-ignore - Nested navigation type issue
      navigation.navigate("MyTrips", {
        screen: "WhereTo",
      });
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" />

      {/* Hero Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={destination.image}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      <View
        style={[
          styles.contentContainer,
          { backgroundColor: currentTheme.background },
        ]}
      >
        {/* Destination Title */}
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.destinationTitle,
                { color: currentTheme.textPrimary },
              ]}
            >
              {destination.name}
            </Text>
          </View>
        </View>

        {/* Best Time to Visit Card */}
        <View style={styles.tripMetaContainer}>
          <View
            style={[
              styles.tripMetaItem,
              { backgroundColor: currentTheme.alternateLight10 },
            ]}
          >
            <View style={styles.tripMetaIconContainer}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color={currentTheme.alternate}
              />
            </View>
            <View style={styles.tripMetaTextContainer}>
              <Text
                style={[
                  styles.tripMetaLabel,
                  { color: currentTheme.textSecondary },
                ]}
              >
                Best Time to Visit
              </Text>
              <Text
                style={[
                  styles.tripMetaText,
                  { color: currentTheme.textPrimary },
                ]}
              >
                {destination.bestTimeToVisit}
              </Text>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View
          style={[
            styles.descriptionContainer,
            { backgroundColor: currentTheme.accentBackgroundLight80 },
          ]}
        >
          <Text
            style={[
              styles.descriptionTitle,
              { color: currentTheme.textPrimary },
            ]}
          >
            About
          </Text>
          <Text
            style={[styles.description, { color: currentTheme.textPrimary }]}
          >
            {destination.description}
          </Text>
        </View>

        {/* Map Section (if coordinates available) */}
        {destination.geoCoordinates && (
          <View style={styles.mapSection}>
            <Text
              style={[
                styles.descriptionTitle,
                { color: currentTheme.textPrimary },
              ]}
            >
              Location
            </Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: destination.geoCoordinates.latitude,
                  longitude: destination.geoCoordinates.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: destination.geoCoordinates.latitude,
                    longitude: destination.geoCoordinates.longitude,
                  }}
                  title={destination.name}
                />
              </MapView>
            </View>
          </View>
        )}

        {/* Start Planning Button */}
        <MainButton
          onPress={fetchDestinationDetails}
          buttonText={isLoading ? "Loading..." : "Start Planning!"}
          disabled={isLoading}
          width="100%"
          style={[
            { backgroundColor: currentTheme.alternate },
            isLoading && styles.disabledButton,
          ]}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    height: height * 0.5,
  },
  image: {
    width: "100%",
    height: "100%",
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
    marginBottom: 5,
  },
  tripMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
  tripMetaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  tripMetaTextContainer: {
    flex: 1,
  },
  tripMetaLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  tripMetaText: {
    fontSize: 16,
  },
  descriptionContainer: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 20,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  exploreButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  exploreButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "outfit-bold",
  },
  mapSection: {
    marginBottom: 24,
  },
  mapContainer: {
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 12,
  },
  map: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default PopularDestinations;
