import { View, Text, FlatList, StyleSheet } from "react-native";
import React, { useState } from "react";
import HotelCard from "./hotelCard";
import { useTheme } from "../../context/themeContext";

interface HotelListProps {
  hotelList: Array<{
    hotelName: string;
    rating: number;
    price: number;
    geoCoordinates: {
      latitude: number;
      longitude: number;
    };
  }>;
}

const HotelList: React.FC<HotelListProps> = ({ hotelList }) => {
  const { currentTheme } = useTheme();
  const [hotelPhotoRefs, setHotelPhotoRefs] = useState<{
    [key: string]: string;
  }>({});

  const handlePhotoRefReady = (hotelName: string, photoRef: string) => {
    setHotelPhotoRefs((prev) => ({
      ...prev,
      [hotelName]: photoRef,
    }));
  };

  const styles = StyleSheet.create({
    title: {
      fontSize: 20,
      color: currentTheme.textPrimary,
    },
  });

  return (
    <View
      style={{
        marginTop: 10,
      }}
    >
      <Text style={styles.title}>🏨 Places to Stay</Text>

      <FlatList
        data={hotelList}
        style={{
          marginTop: 10,
        }}
        showsHorizontalScrollIndicator={false}
        horizontal={true}
        renderItem={({ item }) => (
          <HotelCard
            item={item}
            onPhotoRefReady={(photoRef) =>
              handlePhotoRefReady(item.hotelName, photoRef)
            }
          />
        )}
      />
    </View>
  );
};

export default HotelList;
