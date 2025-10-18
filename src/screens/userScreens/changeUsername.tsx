import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  SafeAreaView,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/src/navigation/appNav";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, updateProfile } from "firebase/auth";
import { FIREBASE_DB } from "@/firebase.config";
import { CustomButton, AltButton } from "@/src/components/button";
import { lightTheme } from "@/src/theme/theme";

// Navigation prop type for the ChangeUsername screen
type ChangeUsernameScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ChangeUsername"
>;

// Constants for username validation
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;

const ChangeUsername: React.FC = () => {
  const currentTheme = lightTheme;
  const navigation = useNavigation<ChangeUsernameScreenNavigationProp>();
  const [userName, setUserName] = useState<string | null>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch current username on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const user = getAuth().currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(FIREBASE_DB, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data?.username || data?.name || "");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, []);

  // Username validation function
  const validateUsername = (username: string) => {
    if (!username || username.length < USERNAME_MIN_LENGTH) {
      return `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
    }
    if (username.length > USERNAME_MAX_LENGTH) {
      return `Username cannot exceed ${USERNAME_MAX_LENGTH} characters`;
    }
    // Only allow letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return null;
  };

  // Handle text input change with validation
  const handleUsernameChange = (text: string) => {
    // Limit to max length
    const trimmedText = text.slice(0, USERNAME_MAX_LENGTH);
    setUserName(trimmedText);
    setErrorMessage(null);
  };

  // Handle saving the new username
  const handleSave = async () => {
    if (!userName) {
      setErrorMessage("Please enter a username");
      return;
    }

    const validationError = validateUsername(userName);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const user = getAuth().currentUser;
    if (user) {
      try {
        // Update both Firestore and Auth display name
        await Promise.all([
          setDoc(
            doc(FIREBASE_DB, "users", user.uid),
            { username: userName },
            { merge: true }
          ),
          updateProfile(user, { displayName: userName }),
        ]);

        Alert.alert("Success", "Username updated successfully!");
        navigation.goBack();
      } catch (error) {
        console.error("Error updating username:", error);
        Alert.alert("Error", "Failed to update username. Please try again.");
      }
    }
  };

  // Handle canceling the username change
  const handleCancel = () => {
    navigation.navigate("Edit");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.contentContainer}>
        {showConfirmation && (
          <View style={styles.confirmationContainer}>
            <Text
              style={[
                styles.confirmationText,
                { color: currentTheme.textPrimary },
              ]}
            >
              Username updated successfully!
            </Text>
          </View>
        )}

        {/* Username input form */}
        <View style={styles.formContainer}>
          <Text
            style={[styles.inputLabel, { color: currentTheme.textPrimary }]}
          >
            Username ({USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters)
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                borderColor: errorMessage ? "#FF3B30" : currentTheme.inactive,
                backgroundColor:
                  currentTheme.background === "#FFFFFF" ? "#F5F5F5" : "#2A2A2A",
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: currentTheme.textPrimary }]}
              placeholder="Enter your username"
              placeholderTextColor={currentTheme.secondary}
              value={userName || ""}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={USERNAME_MAX_LENGTH}
            />
          </View>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </View>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <CustomButton onPress={handleCancel} buttonText="Cancel" />
          <AltButton onPress={handleSave} buttonText="Save" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ChangeUsername;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  formContainer: {
    width: "100%",
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    gap: 12,
  },
  confirmationContainer: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  confirmationText: {
    textAlign: "center",
    fontSize: 16,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginBottom: 16,
  },
});
