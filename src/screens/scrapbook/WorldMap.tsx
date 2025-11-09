import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Region } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import { useScrapbook } from "@/src/context/scrapbookContext";
import { lightTheme } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { TripModel } from "@/src/types/scrapbook";

const DEFAULT_REGION: Region = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 100,
  longitudeDelta: 100,
};

const WorldMap: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state } = useScrapbook();
  const currentTheme = lightTheme;
  const mapRef = useRef<MapView>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripModel | null>(null);

  const tripsWithCoordinates = state.trips.filter(
    (trip) => trip.latitude != null && trip.longitude != null
  );

  const getInitialRegion = (): Region => {
    if (tripsWithCoordinates.length === 0) {
      return DEFAULT_REGION;
    }

    const latitudes = tripsWithCoordinates.map((t) => t.latitude!);
    const longitudes = tripsWithCoordinates.map((t) => t.longitude!);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latDelta = Math.max((maxLat - minLat) * 1.5, 10);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 10);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  const handleMarkerPress = (trip: TripModel) => {
    setSelectedTrip(trip);
  };

  const handleTripPress = (trip: TripModel) => {
    navigation.navigate("TripDetail", { tripId: trip.id });
  };

  const handleFitAllTrips = () => {
    if (tripsWithCoordinates.length === 0) {
      Alert.alert(
        "No Trips on Map",
        "Add trips with locations to see them on the map!"
      );
      return;
    }

    const region = getInitialRegion();
    mapRef.current?.animateToRegion(region, 1000);
  };

  const renderCustomMarker = (trip: TripModel) => {
    const isSelected = selectedTrip?.id === trip.id;

    return (
      <Marker
        key={trip.id}
        coordinate={{
          latitude: trip.latitude!,
          longitude: trip.longitude!,
        }}
        onPress={() => handleMarkerPress(trip)}
      >
        <View
          style={[
            styles.markerContainer,
            {
              transform: [{ scale: isSelected ? 1.2 : 1 }],
            },
          ]}
        >
          <View
            style={[
              styles.tapeDecoration,
              {
                backgroundColor: isSelected
                  ? currentTheme.alternate
                  : "rgba(255, 220, 150, 0.7)",
                transform: [{ rotate: "-45deg" }],
              },
            ]}
          />

          <View
            style={[
              styles.markerPolaroid,
              {
                borderColor: isSelected ? currentTheme.alternate : "#E8E8E8",
                borderWidth: isSelected ? 3 : 2,
              },
            ]}
          >
            {trip.coverPhotoUri ? (
              <Image
                source={{ uri: trip.coverPhotoUri }}
                style={styles.markerImage}
              />
            ) : (
              <View
                style={[
                  styles.markerPlaceholder,
                  { backgroundColor: currentTheme.alternateLight20 },
                ]}
              >
                <Ionicons
                  name="location"
                  size={20}
                  color={currentTheme.alternate}
                />
              </View>
            )}
          </View>

          {isSelected && (
            <View style={styles.markerLabel}>
              <Text style={styles.markerLabelText} numberOfLines={1}>
                {trip.name}
              </Text>
            </View>
          )}
        </View>
      </Marker>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            currentTheme.background === "#FFFFFF"
              ? "#F8F5F0"
              : currentTheme.background,
        },
      ]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text
            style={[styles.headerTitle, { color: currentTheme.textPrimary }]}
          >
            My Travel Map
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: currentTheme.textSecondary },
            ]}
          >
            {tripsWithCoordinates.length}{" "}
            {tripsWithCoordinates.length === 1 ? "trip" : "trips"} on map
          </Text>
        </View>
        <Pressable style={styles.fitButton} onPress={handleFitAllTrips}>
          <Ionicons name="resize" size={20} color={currentTheme.alternate} />
        </Pressable>
      </View>

      {/* 
        TODO: For Google Maps on Android, configure API key in app.json:
        {
          "expo": {
            "android": {
              "config": {
                "googleMaps": {
                  "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
                }
              }
            }
          }
        }
      */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={getInitialRegion()}
        mapType="standard"
        showsUserLocation={false}
        showsMyLocationButton={false}
        scrollEnabled={tripsWithCoordinates.length > 0}
        zoomEnabled={tripsWithCoordinates.length > 0}
        pitchEnabled={tripsWithCoordinates.length > 0}
        rotateEnabled={tripsWithCoordinates.length > 0}
        customMapStyle={[
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: currentTheme.alternateLight20 }],
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#F8F5F0" }],
          },
        ]}
      >
        {tripsWithCoordinates.map((trip) => renderCustomMarker(trip))}
      </MapView>

      {tripsWithCoordinates.length === 0 && <View style={styles.darkOverlay} />}

      {selectedTrip && (
        <Pressable
          style={styles.infoCard}
          onPress={() => handleTripPress(selectedTrip)}
        >
          <View style={styles.infoCardContent}>
            {selectedTrip.coverPhotoUri && (
              <Image
                source={{ uri: selectedTrip.coverPhotoUri }}
                style={styles.infoCardImage}
              />
            )}
            <View style={styles.infoCardText}>
              <Text
                style={[
                  styles.infoCardTitle,
                  { color: currentTheme.textPrimary },
                ]}
                numberOfLines={1}
              >
                {selectedTrip.name}
              </Text>
              <View style={styles.infoCardRow}>
                <Ionicons
                  name="location"
                  size={14}
                  color={currentTheme.textSecondary}
                />
                <Text
                  style={[
                    styles.infoCardDestination,
                    { color: currentTheme.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {selectedTrip.destination}
                </Text>
              </View>
              <View style={styles.infoCardRow}>
                <Ionicons
                  name="calendar"
                  size={14}
                  color={currentTheme.textSecondary}
                />
                <Text
                  style={[
                    styles.infoCardDate,
                    { color: currentTheme.textSecondary },
                  ]}
                >
                  {new Date(selectedTrip.startDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => setSelectedTrip(null)}
            >
              <Ionicons
                name="close"
                size={20}
                color={currentTheme.textSecondary}
              />
            </Pressable>
          </View>
        </Pressable>
      )}

      {tripsWithCoordinates.length === 0 && (
        <View style={styles.emptyState} pointerEvents="box-none">
          <View
            style={[
              styles.emptyStateIcon,
              { backgroundColor: currentTheme.alternateLight20 },
            ]}
          >
            <Ionicons
              name="map-outline"
              size={48}
              color={currentTheme.alternate}
            />
          </View>
          <Text
            style={[styles.emptyStateTitle, { color: currentTheme.textMatch }]}
          >
            No Trips on Map Yet
          </Text>
          <Text
            style={[styles.emptyStateText, { color: currentTheme.textMatch }]}
          >
            Add trips with locations to see them on your world map!
          </Text>
          <Pressable
            style={[
              styles.emptyStateButton,
              { backgroundColor: currentTheme.alternate },
            ]}
            onPress={() => navigation.navigate("AddTrip")}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.emptyStateButtonText}>
              Create Your First Trip
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

export default WorldMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  fitButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(59, 172, 227, 0.1)",
  },
  map: {
    flex: 1,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 1,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  tapeDecoration: {
    position: "absolute",
    top: -8,
    right: 10,
    width: 50,
    height: 20,
    borderRadius: 2,
    zIndex: 10,
  },
  markerPolaroid: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: "#FFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  markerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  markerPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  markerLabel: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: 120,
  },
  markerLabelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  infoCard: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#FFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  infoCardContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  infoCardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: "cover",
  },
  infoCardText: {
    flex: 1,
    gap: 4,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  infoCardDestination: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoCardDate: {
    fontSize: 12,
    fontWeight: "400",
  },
  closeButton: {
    padding: 4,
  },
  emptyState: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 32,
    transform: [{ translateY: -100 }],
    zIndex: 2,
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
