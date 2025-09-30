import React, { useCallback } from "react";
import { View, Text, FlatList, Image, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useScrapbook } from "../../context/scrapbookContext";

const HomeGrid: React.FC = () => {
  const { state, listTrips, sync } = useScrapbook();
  const navigation = useNavigation<any>();

  const renderItem = useCallback(
    ({ item }: any) => (
      <Pressable
        style={{ width: "48%", margin: "1%" }}
        onPress={() => navigation.navigate("TripDetail", { tripId: item.id })}
      >
        <View
          style={{
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "#222",
          }}
        >
          {item.coverPhotoUri ? (
            <Image
              source={{ uri: item.coverPhotoUri }}
              style={{ height: 120 }}
            />
          ) : (
            <View
              style={{
                height: 120,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#999" }}>No Cover</Text>
            </View>
          )}
          <View style={{ padding: 8 }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {item.name}
            </Text>
            <Text style={{ color: "#aaa", fontSize: 12 }}>
              {new Date(item.startDate).getFullYear()}
            </Text>
          </View>
        </View>
      </Pressable>
    ),
    [navigation]
  );

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <FlatList
        data={state.trips}
        numColumns={2}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View style={{ flex: 1, alignItems: "center", marginTop: 40 }}>
            <Text style={{ color: "#888" }}>No trips yet</Text>
          </View>
        )}
      />
      <Pressable
        onPress={() => navigation.navigate("AddTrip")}
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
        <Text style={{ color: "white", fontWeight: "700" }}>Add Trip</Text>
      </Pressable>
    </View>
  );
};

export default HomeGrid;

