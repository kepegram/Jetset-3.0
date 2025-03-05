import {
  StyleSheet,
  Text,
  Pressable,
  View,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
} from "react-native";
import React, { useCallback, useState, useRef, useEffect } from "react";
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
import * as ImageManipulator from "expo-image-manipulator";

// Navigation prop type for type safety when navigating
type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Profile" | "MyTrips"
>;

const Profile: React.FC = () => {
  // Context hooks for profile and theme data
  const { profilePicture, displayName, setProfilePicture, isLoading } =
    useProfile();
  const { currentTheme, setTheme } = useTheme();
  const [userName, setUserName] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const user = getAuth().currentUser;
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  useEffect(() => {
    if (showPrivacy) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showPrivacy]);

  const handleClosePrivacy = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowPrivacy(false);
    });
  };

  // Function to compress image
  const compressImage = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error("Error compressing image:", error);
      throw error;
    }
  };

  // Handle profile picture selection and upload
  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera roll is required!"
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as ImagePicker.MediaType,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        setIsUploadingImage(true);
        try {
          if (!user?.uid) {
            throw new Error("User not authenticated");
          }

          // Compress the image
          const compressedResult = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 800 } }],
            {
              compress: 0.5,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          );

          // Create data URL from base64
          const dataUrl = `data:image/jpeg;base64,${compressedResult.base64}`;

          // Update Firestore with the data URL
          await setDoc(
            doc(FIREBASE_DB, "users", user.uid),
            { profilePicture: dataUrl },
            { merge: true }
          );

          // Update local storage and state
          await AsyncStorage.setItem("profilePicture", dataUrl);
          setProfilePicture(dataUrl);

          console.log("Profile picture updated successfully");
          Alert.alert("Success", "Profile picture updated successfully");
        } catch (error) {
          console.error("Error processing image:", error);
          Alert.alert(
            "Error",
            "Failed to update profile picture. Please try again."
          );
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle profile picture removal
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
              setIsUploadingImage(true);

              // Update state and storage
              setProfilePicture(defaultPfp);
              await AsyncStorage.removeItem("profilePicture");

              // Update Firestore
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
            } finally {
              setIsUploadingImage(false);
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
        animationType="slide"
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
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, { color: currentTheme.textPrimary }]}
              >
                Profile Picture
              </Text>
              <Pressable onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={currentTheme.icon} />
              </Pressable>
            </View>

            {/* Profile picture container */}
            <View style={styles.modalImageWrapper}>
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

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    backgroundColor: pressed
                      ? currentTheme.alternate + "90"
                      : currentTheme.alternate,
                  },
                ]}
                onPress={() => {
                  setIsModalVisible(false);
                  handlePickImage();
                }}
              >
                <MaterialIcons name="edit" size={20} color="#FFF" />
                <Text style={styles.modalButtonText}>
                  Change Profile Picture
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonDanger,
                  {
                    backgroundColor: pressed
                      ? currentTheme.error + "90"
                      : "transparent",
                    borderColor: currentTheme.error,
                  },
                ]}
                onPress={() => {
                  setIsModalVisible(false);
                  handleRemoveProfilePicture();
                }}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={20}
                  color={currentTheme.error}
                />
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: currentTheme.error },
                  ]}
                >
                  Remove Profile Picture
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Update the Privacy Modal */}
      <Modal
        visible={showPrivacy}
        transparent={true}
        onRequestClose={handleClosePrivacy}
        statusBarTranslucent={true}
        animationType="none"
      >
        <Animated.View
          style={[
            modalStyles.modalContainer,
            {
              opacity: fadeAnim,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          ]}
        >
          <Animated.View
            style={[
              modalStyles.modalContent,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Privacy onClose={handleClosePrivacy} />
          </Animated.View>
        </Animated.View>
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
            {isUploadingImage ? (
              <View style={[styles.profilePicture, styles.loadingContainer]}>
                <ActivityIndicator
                  size="large"
                  color={currentTheme.alternate}
                />
              </View>
            ) : (
              <>
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
                <Pressable
                  style={styles.editIconContainer}
                  onPress={handlePickImage}
                  disabled={isUploadingImage}
                >
                  <Ionicons name="pencil" size={16} color="#FFFFFF" />
                </Pressable>
              </>
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
            onPress={() =>
              navigation.navigate("MyTrips", { screen: "MyTripsMain" })
            }
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
            onPress={() => navigation.navigate("NotificationSettings")}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={currentTheme.icon}
              />
              <Text
                style={[
                  styles.optionText,
                  { color: currentTheme.textSecondary },
                ]}
              >
                Notifications
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
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalView: {
    width: "90%",
    borderRadius: 20,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "outfit-bold",
  },
  modalImageWrapper: {
    padding: 20,
    alignItems: "center",
  },
  modalImageContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    overflow: "hidden",
  },
  modalProfilePicture: {
    width: "100%",
    height: "100%",
  },
  modalActions: {
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  modalButtonDanger: {
    borderWidth: 1,
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "outfit-medium",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
});
