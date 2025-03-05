import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  ScrollView,
  Linking,
} from "react-native";
import { useTheme } from "../../../../context/themeContext";
import { RootStackParamList } from "../../../../navigation/appNav";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MapView from "react-native-maps";
import { Marker } from "react-native-maps";

const { width, height } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "IteneraryDetail"
>;

type RouteProps = RouteProp<RootStackParamList, "IteneraryDetail">;

const IteneraryDetail: React.FC = () => {
  const { currentTheme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { place } = route.params;

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "",
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={"white"} />
        </Pressable>
      ),
    });
  }, [navigation, currentTheme]);

  const handleOpenUrl = async () => {
    if (place.placeUrl) {
      await Linking.openURL(place.placeUrl);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={
              place.photoRef
                ? {
                    uri:
                      "https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=" +
                      place.photoRef +
                      "&key=" +
                      // @ts-ignore
                      process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY,
                  }
                : require("../../../../assets/app-imgs/place-placeholder.jpg")
            }
            style={styles.image}
          />
        </View>

        <View
          style={[
            styles.contentContainer,
            { backgroundColor: currentTheme.background },
          ]}
        >
          <View style={styles.detailsContainer}>
            <Text
              style={[styles.placeTitle, { color: currentTheme.textPrimary }]}
            >
              {place.placeName}
            </Text>

            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: currentTheme.textPrimary },
                ]}
              >
                About this place
              </Text>
              <Text
                style={[
                  styles.detailText,
                  { color: currentTheme.textSecondary },
                ]}
              >
                {place.placeDetails}
              </Text>
              <Text
                style={[
                  styles.detailText,
                  { color: currentTheme.textSecondary },
                ]}
              >
                {place.placeExtendedDetails}
              </Text>
            </View>

            {place.geoCoordinates && (
              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: currentTheme.textPrimary },
                  ]}
                >
                  Location
                </Text>
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: place.geoCoordinates.latitude,
                      longitude: place.geoCoordinates.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                  >
                    <Marker
                      coordinate={{
                        latitude: place.geoCoordinates.latitude,
                        longitude: place.geoCoordinates.longitude,
                      }}
                      title={place.placeName}
                    />
                  </MapView>
                </View>
              </View>
            )}

            {place.placeUrl && (
              <Pressable
                style={[
                  styles.linkButton,
                  { backgroundColor: currentTheme.alternate },
                ]}
                onPress={handleOpenUrl}
              >
                <Ionicons name="globe-outline" size={24} color="white" />
                <Text style={styles.linkButtonText}>
                  Visit Official Website
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  imageContainer: {
    height: height * 0.5,
    width: width,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  contentContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    minHeight: height * 0.6,
  },
  detailsContainer: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "outfit-bold",
  },
  detailText: {
    fontSize: 16,
    fontFamily: "outfit",
    lineHeight: 24,
  },
  mapContainer: {
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  linkButton: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  linkButtonText: {
    fontSize: 16,
    fontFamily: "outfit-medium",
    color: "white",
  },
  placeTitle: {
    fontSize: 32,
    fontFamily: "outfit-bold",
  },
});

export default IteneraryDetail;
