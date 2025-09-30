import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useScrapbook } from "../../context/scrapbookContext";

const AddTrip: React.FC = () => {
  const { createTrip } = useScrapbook();
  const navigation = useNavigation<any>();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | undefined>();

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!res.canceled) setCoverPhotoUri(res.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name || !destination || !startDate || !endDate) return;
    await createTrip({ name, destination, startDate, endDate, coverPhotoUri });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>
        New Trip
      </Text>
      <TextInput
        placeholder="Name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
        style={{
          color: "#fff",
          borderBottomWidth: 1,
          borderColor: "#555",
          marginTop: 16,
        }}
      />
      <TextInput
        placeholder="Destination"
        placeholderTextColor="#888"
        value={destination}
        onChangeText={setDestination}
        style={{
          color: "#fff",
          borderBottomWidth: 1,
          borderColor: "#555",
          marginTop: 16,
        }}
      />
      <TextInput
        placeholder="Start Date (YYYY-MM-DD)"
        placeholderTextColor="#888"
        value={startDate}
        onChangeText={setStartDate}
        style={{
          color: "#fff",
          borderBottomWidth: 1,
          borderColor: "#555",
          marginTop: 16,
        }}
      />
      <TextInput
        placeholder="End Date (YYYY-MM-DD)"
        placeholderTextColor="#888"
        value={endDate}
        onChangeText={setEndDate}
        style={{
          color: "#fff",
          borderBottomWidth: 1,
          borderColor: "#555",
          marginTop: 16,
        }}
      />
      <Pressable onPress={pickImage} style={{ marginTop: 16 }}>
        <Text style={{ color: "#60a5fa" }}>
          {coverPhotoUri ? "Change Cover Photo" : "Pick Cover Photo"}
        </Text>
      </Pressable>
      <Pressable
        onPress={handleSave}
        style={{
          marginTop: 24,
          backgroundColor: "#22c55e",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <Text
          style={{ color: "white", textAlign: "center", fontWeight: "700" }}
        >
          Save Trip
        </Text>
      </Pressable>
    </View>
  );
};

export default AddTrip;
