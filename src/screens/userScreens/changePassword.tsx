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

type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ChangePassword"
>;

const ChangePassword: React.FC = () => {
  const currentTheme = lightTheme;
  const [email, setEmail] = useState<string | null>("");
  const [password, setPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [oldPasswordHidden, setOldPasswordHidden] = useState<boolean>(true);
  const [newPasswordHidden, setNewPasswordHidden] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigation = useNavigation<ChangePasswordScreenNavigationProp>();

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

  const handleSave = async () => {
    setErrorMessage(null);

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
        const credential = EmailAuthProvider.credential(email, password);
        await reauthenticateWithCredential(user, credential);

        await updatePassword(user, newPassword);

        alert("Password updated successfully!");
        navigation.navigate("Profile");
      } catch (error: any) {
        console.error("Error updating password:", error);
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

  const handleCancel = () => {
    navigation.navigate("Profile");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.contentContainer}>
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

          {errorMessage && (
            <Text style={[styles.errorText, { color: currentTheme.error }]}>
              {errorMessage}
            </Text>
          )}
        </View>

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
