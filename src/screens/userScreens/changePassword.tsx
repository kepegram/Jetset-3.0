import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  SafeAreaView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { AltButton, CustomButton } from "@/src/components/button";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { FIREBASE_DB } from "@/firebase.config";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/src/navigation/appNav";
import { useNavigation } from "@react-navigation/native";
import { lightTheme } from "@/src/theme/theme";

// Navigation prop type for the ChangePassword screen
type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ChangePassword"
>;

const ChangePassword: React.FC = () => {
  const currentTheme = lightTheme;
  // State for managing form inputs and visibility
  const [email, setEmail] = useState<string | null>("");
  const [password, setPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [oldPasswordHidden, setOldPasswordHidden] = useState<boolean>(true);
  const [newPasswordHidden, setNewPasswordHidden] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigation = useNavigation<ChangePasswordScreenNavigationProp>();

  // Fetch user email on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const user = getAuth().currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(FIREBASE_DB, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setEmail(data?.email || "");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, []);

  // Handle password update
  const handleSave = async () => {
    // Reset error message
    setErrorMessage(null);

    // Validation checks
    if (!password) {
      setErrorMessage("Please enter your current password");
      return;
    }

    if (!newPassword) {
      setErrorMessage("New password cannot be empty");
      return;
    }

    if (newPassword === password) {
      setErrorMessage(
        "New password must be different from your current password"
      );
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long");
      return;
    }

    const user = getAuth().currentUser;
    if (user && email) {
      try {
        // Re-authenticate user with current password
        const credential = EmailAuthProvider.credential(email, password);
        await reauthenticateWithCredential(user, credential);

        // Update to new password
        await updatePassword(user, newPassword);

        // Show success alert
        alert("Password updated successfully!");
        navigation.navigate("Profile");
      } catch (error: any) {
        console.error("Error updating password:", error);
        // Handle specific Firebase error codes
        if (error.code === "auth/wrong-password") {
          setErrorMessage("Current password is incorrect");
        } else if (error.code === "auth/too-many-requests") {
          setErrorMessage(
            "Too many unsuccessful attempts. Please try again later"
          );
        } else if (error.code === "auth/requires-recent-login") {
          setErrorMessage(
            "For security reasons, please log out and log back in before changing your password"
          );
        } else {
          setErrorMessage("Failed to update password. Please try again");
        }
      }
    }
  };

  // Handle canceling password change
  const handleCancel = () => {
    navigation.navigate("Profile");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.contentContainer}>
        {/* Current password input */}
        <View style={styles.formContainer}>
          <Text
            style={[styles.inputLabel, { color: currentTheme.textPrimary }]}
          >
            Current Password
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                borderColor: currentTheme.inactive,
                backgroundColor:
                  currentTheme.background === "#FFFFFF" ? "#F5F5F5" : "#2A2A2A",
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: currentTheme.textPrimary }]}
              placeholder="Enter current password"
              placeholderTextColor={currentTheme.secondary}
              value={password}
              secureTextEntry={oldPasswordHidden}
              onChangeText={setPassword}
            />
            {/* Updated eye icon style to match signup.tsx */}
            <Pressable
              style={styles.eyeIcon}
              onPress={() => setOldPasswordHidden(!oldPasswordHidden)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={oldPasswordHidden ? "eye" : "eye-off"}
                size={24}
                color={currentTheme.secondary}
              />
            </Pressable>
          </View>

          {/* New password input */}
          <Text
            style={[styles.inputLabel, { color: currentTheme.textPrimary }]}
          >
            New Password
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                borderColor: currentTheme.inactive,
                backgroundColor:
                  currentTheme.background === "#FFFFFF" ? "#F5F5F5" : "#2A2A2A",
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: currentTheme.textPrimary }]}
              placeholder="Enter new password"
              placeholderTextColor={currentTheme.secondary}
              value={newPassword}
              secureTextEntry={newPasswordHidden}
              onChangeText={setNewPassword}
            />
            {/* Updated eye icon style to match signup.tsx */}
            <Pressable
              style={styles.eyeIcon}
              onPress={() => setNewPasswordHidden(!newPasswordHidden)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={newPasswordHidden ? "eye" : "eye-off"}
                size={24}
                color={currentTheme.secondary}
              />
            </Pressable>
          </View>

          {/* Error message placed below both password inputs */}
          {errorMessage && (
            <Text style={[styles.errorText, { color: currentTheme.error }]}>
              {errorMessage}
            </Text>
          )}
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

export default ChangePassword;

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
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
  },
});
