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
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useScrapbook } from "../../context/scrapbookContext";
import { useTheme } from "../../context/themeContext";
import { Ionicons } from "@expo/vector-icons";

const AddTrip: React.FC = () => {
  const { createTrip } = useScrapbook();
  const navigation = useNavigation<any>();
  const { currentTheme } = useTheme();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | undefined>();

  const pickImage = async () => {
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
      allowsMultipleSelection: false,
      quality: 0.8,
      mediaTypes: "images",
    });
    if (!res.canceled) setCoverPhotoUri(res.assets[0].uri);
  };

  const validateDateFormat = (dateString: string): boolean => {
    // Check if date matches MM-DD-YYYY format
    const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    // Check if it's a valid date
    const [month, day, year] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const formatDateForStorage = (dateString: string): string => {
    // Convert MM-DD-YYYY to ISO string for storage
    const [month, day, year] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toISOString();
  };

  const handleSave = async () => {
    if (!name || !destination || !startDate || !endDate) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    // Validate date formats
    if (!validateDateFormat(startDate)) {
      Alert.alert(
        "Invalid Date Format",
        "Start date must be in MM-DD-YYYY format (e.g., 12-25-2024)."
      );
      return;
    }

    if (!validateDateFormat(endDate)) {
      Alert.alert(
        "Invalid Date Format",
        "End date must be in MM-DD-YYYY format (e.g., 12-25-2024)."
      );
      return;
    }

    // Check if end date is after start date
    const startDateObj = new Date(formatDateForStorage(startDate));
    const endDateObj = new Date(formatDateForStorage(endDate));

    if (endDateObj <= startDateObj) {
      Alert.alert(
        "Invalid Date Range",
        "End date must be after the start date."
      );
      return;
    }

    try {
      await createTrip({
        name,
        destination,
        startDate: formatDateForStorage(startDate),
        endDate: formatDateForStorage(endDate),
        coverPhotoUri,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to create trip. Please try again.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
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
            New Trip
          </Text>
          <Text
            style={[styles.subtitle, { color: currentTheme.textSecondary }]}
          >
            Create a new travel scrapbook
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textPrimary }]}>
              Trip Name *
            </Text>
            <TextInput
              placeholder="Enter trip name"
              placeholderTextColor={currentTheme.textSecondary}
              value={name}
              onChangeText={setName}
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
              Destination *
            </Text>
            <TextInput
              placeholder="Where are you going?"
              placeholderTextColor={currentTheme.textSecondary}
              value={destination}
              onChangeText={setDestination}
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

          <View style={styles.dateRow}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: currentTheme.textPrimary }]}>
                Start Date *
              </Text>
              <TextInput
                placeholder="MM-DD-YYYY (e.g., 12-25-2024)"
                placeholderTextColor={currentTheme.textSecondary}
                value={startDate}
                onChangeText={setStartDate}
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

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: currentTheme.textPrimary }]}>
                End Date *
              </Text>
              <TextInput
                placeholder="MM-DD-YYYY (e.g., 12-30-2024)"
                placeholderTextColor={currentTheme.textSecondary}
                value={endDate}
                onChangeText={setEndDate}
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
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textPrimary }]}>
              Cover Photo
            </Text>
            <Pressable
              onPress={pickImage}
              style={({ pressed }) => [
                styles.imagePicker,
                {
                  backgroundColor: currentTheme.accentBackground,
                  borderColor: currentTheme.inactive,
                },
                pressed && styles.imagePickerPressed,
              ]}
            >
              {coverPhotoUri ? (
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: coverPhotoUri }}
                    style={styles.previewImage}
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={20} color="white" />
                    <Text style={styles.overlayText}>Change Photo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons
                    name="camera-outline"
                    size={32}
                    color={currentTheme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.placeholderText,
                      { color: currentTheme.textSecondary },
                    ]}
                  >
                    Tap to add cover photo
                  </Text>
                </View>
              )}
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
          <Text style={styles.saveButtonText}>Create Trip</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default AddTrip;

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
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  imagePicker: {
    borderWidth: 1,
    borderRadius: 12,
    height: 120,
    overflow: "hidden",
  },
  imagePickerPressed: {
    opacity: 0.8,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 10,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
