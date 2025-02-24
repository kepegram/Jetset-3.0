import {
  StyleSheet,
  Text,
  Pressable,
  View,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
} from "react-native";
import React, { useCallback, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/appNav";
import { useProfile } from "../../../context/profileContext";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../../../firebase.config";
import { useTheme } from "../../../context/themeContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { modalStyles } from "../../../screens/onboarding/welcome/welcome";
import Privacy from "../../../screens/onboarding/privacy/Privacy";

// Navigation prop type for type safety when navigating
type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Profile"
>;

const Profile: React.FC = () => {
  // Context hooks for profile and theme data
  const { profilePicture, displayName, setProfilePicture, isLoading } =
    useProfile();
  const { currentTheme, setTheme } = useTheme();
  const [userName, setUserName] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const user = getAuth().currentUser;
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  // Handle profile picture selection and upload
  const handlePickImage = async () => {
    // Request permission to access media library
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as ImagePicker.MediaType,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfilePicture(uri);

      // Save profile picture URI to Firestore
      if (user) {
        try {
          await setDoc(
            doc(FIREBASE_DB, "users", user.uid),
            { profilePicture: uri },
            { merge: true }
          );
          console.log("Profile picture updated successfully in Firestore.");
        } catch (error) {
          console.error("Failed to save profile picture to Firestore:", error);
        }
      }

      // Cache profile picture locally
      await AsyncStorage.setItem("profilePicture", uri);
    }
  };

  // Add this new function to handle profile picture removal
  const handleRemoveProfilePicture = () => {
    Alert.alert(
      "Remove Profile Picture",
      "Are you sure you want to remove your profile picture?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const defaultPfp =
              "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png";

            try {
              // Update state and AsyncStorage
              setProfilePicture(defaultPfp);
              await AsyncStorage.removeItem("profilePicture");

              // Remove from Firestore
              if (user) {
                await setDoc(
                  doc(FIREBASE_DB, "users", user.uid),
                  {
                    profilePicture: defaultPfp,
                  },
                  { merge: true }
                );
              }

              console.log("Profile picture removed successfully");
            } catch (error) {
              console.error("Failed to remove profile picture:", error);
              Alert.alert("Error", "Failed to remove profile picture");
            }
          },
        },
      ]
    );
  };

  // Handle user logout with confirmation
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => {
            setTheme("light"); // Reset theme to light
            FIREBASE_AUTH.signOut();
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Fetch user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        if (user) {
          try {
            const userDoc = await getDoc(doc(FIREBASE_DB, "users", user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setUserName(data?.name || data?.username || "");
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        }
      };

      fetchUserData();
    }, [])
  );

  // Add this function to handle profile picture press
  const handleProfilePress = () => {
    setIsModalVisible(true);
  };

  // Update the privacy press handler
  const handlePrivacyPress = () => {
    setShowPrivacy(true);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      {/* Add Modal component */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsModalVisible(false)}
        >
          <View
            style={[
              styles.modalView,
              { backgroundColor: currentTheme.background },
            ]}
          >
            {/* Add the large profile picture */}
            <View style={styles.modalImageContainer}>
              <View
                style={[
                  styles.modalImageContainer,
                  { backgroundColor: currentTheme.inactive + "20" },
                ]}
              >
                <Image
                  source={{
                    uri:
                      profilePicture ||
                      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png",
                    cache: "reload",
                  }}
                  style={styles.modalProfilePicture}
                  onError={(e) =>
                    console.log("Error loading image:", e.nativeEvent.error)
                  }
                />
              </View>
            </View>

            <Pressable
              style={[
                styles.modalOption,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: currentTheme.secondary,
                },
              ]}
              onPress={() => {
                setIsModalVisible(false);
                handlePickImage();
              }}
            >
              <MaterialIcons name="edit" size={24} color={currentTheme.icon} />
              <Text
                style={[
                  styles.modalOptionText,
                  { color: currentTheme.textPrimary },
                ]}
              >
                Change Profile Picture
              </Text>
            </Pressable>

            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setIsModalVisible(false);
                handleRemoveProfilePicture();
              }}
            >
              <MaterialIcons
                name="delete-outline"
                size={24}
                color={currentTheme.error}
              />
              <Text
                style={[styles.modalOptionText, { color: currentTheme.error }]}
              >
                Remove Profile Picture
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Add the Privacy Modal */}
      <Modal
        visible={showPrivacy}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrivacy(false)}
        statusBarTranslucent={true}
      >
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalContent}>
            <Privacy onClose={() => setShowPrivacy(false)} />
          </View>
        </View>
      </Modal>

      <View style={styles.profileContainer}>
        <View style={styles.userInfoContainer}>
          <Text style={[styles.userName, { color: currentTheme.textPrimary }]}>
            {displayName || userName}
          </Text>
        </View>

        <View style={styles.profileImageContainer}>
          <Pressable
            onPress={handleProfilePress}
            style={styles.profilePictureBackground}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color={currentTheme.primary} />
            ) : (
              <Image
                source={{
                  uri:
                    profilePicture ||
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png",
                  cache: "reload",
                }}
                style={styles.profilePicture}
                onError={(e) =>
                  console.log("Error loading image:", e.nativeEvent.error)
                }
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.settingsContainer}>
        <View style={styles.optionsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.settingOption,
              pressed && styles.optionPressed,
              {
                backgroundColor: pressed
                  ? currentTheme.inactive + "20"
                  : "transparent",
              },
            ]}
            onPress={() => navigation.navigate("Edit")}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color={currentTheme.icon}
              />
              <Text
                style={[
                  styles.optionText,
                  { color: currentTheme.textSecondary },
                ]}
              >
                Manage Account
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={currentTheme.icon}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingOption,
              pressed && styles.optionPressed,
              {
                backgroundColor: pressed
                  ? currentTheme.inactive + "20"
                  : "transparent",
              },
            ]}
            onPress={() => navigation.navigate("MyTripsMain")}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name="airplane-outline"
                size={24}
                color={currentTheme.icon}
              />
              <Text
                style={[
                  styles.optionText,
                  { color: currentTheme.textSecondary },
                ]}
              >
                My Trips
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={currentTheme.icon}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingOption,
              pressed && styles.optionPressed,
              {
                backgroundColor: pressed
                  ? currentTheme.inactive + "20"
                  : "transparent",
              },
            ]}
            onPress={() => navigation.navigate("AppTheme")}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name="color-palette-outline"
                size={24}
                color={currentTheme.icon}
              />
              <Text
                style={[
                  styles.optionText,
                  { color: currentTheme.textSecondary },
                ]}
              >
                App Theme
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={currentTheme.icon}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingOption,
              pressed && styles.optionPressed,
              {
                backgroundColor: pressed
                  ? currentTheme.inactive + "20"
                  : "transparent",
              },
            ]}
            onPress={handlePrivacyPress}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name="shield-outline"
                size={24}
                color={currentTheme.icon}
              />
              <Text
                style={[
                  styles.optionText,
                  { color: currentTheme.textSecondary },
                ]}
              >
                Security & Privacy
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={currentTheme.icon}
            />
          </Pressable>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleLogout}
        >
          <Text
            style={[
              styles.logoutButtonText,
              { color: currentTheme.textPrimary },
            ]}
          >
            Sign out
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 80,
  },
  userInfoContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "outfit-bold",
  },
  profileImageContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profilePictureBackground: {
    width: 130,
    height: 130,
    borderRadius: 65,
    position: "relative",
  },
  profilePicture: {
    width: "100%",
    height: "100%",
    borderRadius: 65,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsContainer: {
    flex: 1,
    width: "90%",
    alignSelf: "center",
    marginTop: 20,
  },
  optionsContainer: {
    marginTop: 10,
    borderRadius: 15,
    overflow: "hidden",
  },
  settingOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionPressed: {
    opacity: 0.8,
  },
  optionText: {
    fontSize: 18,
    marginLeft: 15,
  },
  logoutContainer: {
    alignItems: "center",
    width: "100%",
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: "90%",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "80%",
    borderRadius: 15,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  modalImageContainer: {
    width: "100%",
    aspectRatio: 1,
  },
  modalProfilePicture: {
    width: "100%",
    height: "100%",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
    fontFamily: "outfit-medium",
  },
});
