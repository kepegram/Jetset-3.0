import { View, Text, Image, Pressable } from "react-native";
import React, { useEffect, useState } from "react";
import { GetPhotoRef } from "../../api/googlePlaceApi";
import { useTheme } from "../../context/themeContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/appNav";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "HotelDetail"
>;

interface HotelCardProps {
  item: {
    hotelName: string;
    rating: number;
    price: number;
    geoCoordinates: {
      latitude: number;
      longitude: number;
    };
  };
  onPhotoRefReady?: (photoRef: string) => void;
}

const HotelCard: React.FC<HotelCardProps> = ({ item }) => {
  const { currentTheme } = useTheme();
  const [photoRef, setPhotoRef] = useState<string | undefined>();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    GetGooglePhotoRef();
  }, []);

  const GetGooglePhotoRef = async () => {
    const result = await GetPhotoRef(item.hotelName);
    setPhotoRef(result);
  };

  return (
    <Pressable
      onPress={() =>
        navigation.navigate("HotelDetail", {
          hotel: {
            ...item,
            photoRef,
          },
        })
      }
    >
      <View
        style={{
          marginRight: 20,
          width: 180,
          backgroundColor: currentTheme.accentBackground,
          borderRadius: 15,
          overflow: "hidden",
        }}
      >
        <Image
          source={{
            uri: photoRef
              ? "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=" +
                photoRef +
                "&key=" +
                process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY
              : require("../../assets/app-imgs/place-placeholder.jpg"),
          }}
          style={{
            width: 180,
            height: 120,
          }}
        />
        <View
          style={{
            padding: 5,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              color: currentTheme.textPrimary,
            }}
            numberOfLines={1}
          >
            {item.hotelName}
          </Text>

          <View
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: currentTheme.textSecondary,
              }}
            >
              Rating: {item.rating} ⭐
            </Text>
            <Text
              style={{
                color: currentTheme.textSecondary,
              }}
            >
              Price: ${item.price}/night
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default HotelCard;
