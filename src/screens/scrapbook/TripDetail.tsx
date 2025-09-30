import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, Pressable } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useScrapbook } from "../../context/scrapbookContext";

const TripDetail: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { state, listExcursions } = useScrapbook();
  const { tripId } = route.params as { tripId: string };
  const trip = state.trips.find((t) => t.id === tripId);
  const [excursions, setExcursions] = useState<any[]>([]);

  useEffect(() => {
    listExcursions(tripId).then(setExcursions);
  }, [tripId, listExcursions]);

  if (!trip) return null;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>
          {trip.name}
        </Text>
        <Text style={{ color: "#aaa" }}>{trip.destination}</Text>
      </View>
      <FlatList
        data={excursions}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <View
            style={{ padding: 12, borderBottomWidth: 1, borderColor: "#333" }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {item.title}
            </Text>
            {item.photoUris?.[0] ? (
              <Image
                source={{ uri: item.photoUris[0] }}
                style={{ height: 160, marginTop: 8, borderRadius: 8 }}
              />
            ) : null}
            {item.description ? (
              <Text style={{ color: "#bbb", marginTop: 6 }}>
                {item.description}
              </Text>
            ) : null}
          </View>
        )}
      />
      <Pressable
        onPress={() => navigation.navigate("AddExcursion", { tripId })}
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          backgroundColor: "#3b82f6",
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 24,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Add Entry</Text>
      </Pressable>
    </View>
  );
};

export default TripDetail;

