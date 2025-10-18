import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useScrapbook } from "@/src/context/scrapbookContext";
import { lightTheme } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";

const AddExcursion: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { tripId } = route.params as { tripId: string };
  const { createExcursion } = useScrapbook();
  const currentTheme = lightTheme;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  const pickImages = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera roll is required!"
      );
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
      mediaTypes: "images",
    });
    if (!res.canceled) setPhotoUris(res.assets.map((a) => a.uri));
  };

  const removePhoto = (index: number) => {
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title) {
      Alert.alert(
        "Missing Information",
        "Please enter a title for your entry."
      );
      return;
    }

    try {
      await createExcursion({ tripId, title, description, photoUris });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save entry. Please try again.");
    }
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
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentTheme.textPrimary}
          />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: currentTheme.textPrimary }]}>
            New Entry
          </Text>
          <Text
            style={[styles.subtitle, { color: currentTheme.textSecondary }]}
          >
            Document your adventure
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {/* Decorative tape elements */}
          <View style={[styles.decorativeTape, styles.tape1]} />
          <View style={[styles.decorativeTape, styles.tape2]} />
          <View style={[styles.decorativeTape, styles.tape3]} />

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textPrimary }]}>
              Title *
            </Text>
            <TextInput
              placeholder="What did you do?"
              placeholderTextColor={currentTheme.textSecondary}
              value={title}
              onChangeText={setTitle}
              style={[
                styles.input,
                {
                  color: currentTheme.textPrimary,
                  borderColor: currentTheme.inactive,
                  backgroundColor: currentTheme.accentBackground,
                },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textPrimary }]}>
              Notes
            </Text>
            <TextInput
              placeholder="Share your thoughts and memories..."
              placeholderTextColor={currentTheme.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[
                styles.textArea,
                {
                  color: currentTheme.textPrimary,
                  borderColor: currentTheme.inactive,
                  backgroundColor: currentTheme.accentBackground,
                },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textPrimary }]}>
              Photos
            </Text>

            {photoUris.length > 0 && (
              <View style={styles.photoGrid}>
                {photoUris.map((uri, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri }} style={styles.photoPreview} />
                    <Pressable
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="white" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={pickImages}
              style={({ pressed }) => [
                styles.photoPicker,
                {
                  backgroundColor: currentTheme.accentBackground,
                  borderColor: currentTheme.inactive,
                },
                pressed && styles.photoPickerPressed,
              ]}
            >
              <Ionicons
                name="camera-outline"
                size={24}
                color={currentTheme.textSecondary}
              />
              <Text
                style={[
                  styles.photoPickerText,
                  { color: currentTheme.textSecondary },
                ]}
              >
                {photoUris.length > 0
                  ? `Add More Photos (${photoUris.length})`
                  : "Add Photos"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: currentTheme.alternate },
            pressed && styles.saveButtonPressed,
          ]}
        >
          <Ionicons name="checkmark" size={20} color="white" />
          <Text style={styles.saveButtonText}>Save Entry</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default AddExcursion;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  form: {
    padding: 20,
    paddingTop: 10,
    position: "relative",
  },
  decorativeTape: {
    position: "absolute",
    height: 30,
    backgroundColor: "rgba(255, 220, 150, 0.7)",
    borderRadius: 2,
    zIndex: 1,
  },
  tape1: {
    width: 70,
    top: 50,
    right: 25,
    transform: [{ rotate: "-20deg" }],
  },
  tape2: {
    width: 80,
    top: 250,
    left: 15,
    backgroundColor: "rgba(200, 230, 255, 0.7)",
    transform: [{ rotate: "15deg" }],
  },
  tape3: {
    width: 60,
    top: 420,
    right: 30,
    backgroundColor: "rgba(255, 200, 200, 0.6)",
    transform: [{ rotate: "-10deg" }],
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontWeight: "500",
    backgroundColor: "#FAFAFA",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  textArea: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontWeight: "500",
    minHeight: 100,
    backgroundColor: "#FAFAFA",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  photoItem: {
    position: "relative",
    width: 80,
    height: 80,
    transform: [{ rotate: "-2deg" }],
  },
  photoPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
    resizeMode: "cover",
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  removePhotoButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 10,
  },
  photoPicker: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FAFAFA",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  photoPickerPressed: {
    opacity: 0.8,
  },
  photoPickerText: {
    fontSize: 16,
    fontWeight: "500",
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 10,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 30,
    backgroundColor: "#FF6B6B",
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 8,
  },
});
