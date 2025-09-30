import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useScrapbook } from "../../context/scrapbookContext";

const AddExcursion: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { tripId } = route.params as { tripId: string };
  const { createExcursion } = useScrapbook();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!res.canceled) setPhotoUris(res.assets.map((a) => a.uri));
  };

  const handleSave = async () => {
    if (!title) return;
    await createExcursion({ tripId, title, description, photoUris });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>
        New Entry
      </Text>
      <TextInput
        placeholder="Title"
        placeholderTextColor="#888"
        value={title}
        onChangeText={setTitle}
        style={{
          color: "#fff",
          borderBottomWidth: 1,
          borderColor: "#555",
          marginTop: 16,
        }}
      />
      <TextInput
        placeholder="Notes"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
        style={{
          color: "#fff",
          borderBottomWidth: 1,
          borderColor: "#555",
          marginTop: 16,
        }}
      />
      <Pressable onPress={pickImages} style={{ marginTop: 16 }}>
        <Text style={{ color: "#60a5fa" }}>
          {photoUris.length
            ? `Selected ${photoUris.length} photos`
            : "Pick Photos"}
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
          Save Entry
        </Text>
      </Pressable>
    </View>
  );
};

export default AddExcursion;
