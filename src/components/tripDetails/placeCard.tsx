import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { GetPhotoRef } from "../../api/googlePlaceApi";
import { useTheme } from "../../context/themeContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/appNav";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Place {
  placeName: string;
  placeDetails: string;
  placeExtendedDetails: string;
  placeUrl: string;
  timeToTravel: string;
  geoCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface PlaceCardProps {
  place: Place;
  onPhotoRefReady?: (photoRef: string) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onPhotoRefReady }) => {
  const { currentTheme } = useTheme();
  const [photoRef, setPhotoRef] = useState<string | undefined>();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    GetGooglePhotoRef();
  }, []);

  const GetGooglePhotoRef = async () => {
    const result = await GetPhotoRef(place.placeName);
    setPhotoRef(result);
    if (result && onPhotoRefReady) {
      onPhotoRefReady(result);
    }
  };

  const handlePress = () => {
    navigation.navigate("IteneraryDetail", {
      place: {
        ...place,
        photoRef,
      },
    });
  };

  const styles = StyleSheet.create({
    card: {
      marginVertical: 10,
      borderRadius: 15,
      overflow: "hidden",
    },
    imageContainer: {
      height: 200, // Adjust height as needed
    },
    image: {
      width: "100%",
      height: "100%",
    },
    contentContainer: {
      padding: 15,
    },
    placeName: {
      fontSize: 20,
      color: currentTheme.textPrimary,
    },
    placeLocation: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
  });

  return (
    <Pressable onPress={handlePress} style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={
            photoRef
              ? {
                  uri:
                    "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=" +
                    photoRef +
                    "&key=" +
                    process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY,
                }
              : require("../../assets/app-imgs/place-placeholder.jpg")
          }
          style={styles.image}
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.placeName}>{place?.placeName}</Text>
        <View style={{ marginTop: 5 }} />
        <Text style={styles.placeLocation}>{place.placeDetails}</Text>
      </View>
    </Pressable>
  );
};

export default PlaceCard;
