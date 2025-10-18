import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/firebase.config";
import {
  deleteDoc,
  doc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { lightTheme } from "@/src/theme/theme";
// Google auth removed

const DeleteAccount: React.FC = () => {
  const currentTheme = lightTheme;
  // Get current user at component level
  const currentUser = FIREBASE_AUTH.currentUser;
  // State for tracking user's deletion reason and credentials
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Predefined list of reasons for account deletion
  const reasons = [
    "Switching to another app",
    "Privacy concerns",
    "App is too complicated",
    "Found a better alternative",
    "Other",
  ];

  const handleDeleteAccount = async () => {
    setError(null);
    setLoading(true);

    const reasonToSubmit =
      selectedReason === "Other" ? otherReason : selectedReason;

    if (!reasonToSubmit) {
      setError("Please select a reason or fill in the 'Other' reason.");
      setLoading(false);
      return;
    }

    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      setError("No user is logged in.");
      setLoading(false);
      return;
    }

    try {
      let isAuthenticated = false;

      // For Google auth, skip reauthentication
      if (
        user.providerData.some(
          (provider) => provider.providerId === "google.com"
        )
      ) {
        isAuthenticated = true; // Skip reauthentication for Google users
      } else {
        // Only email/password users need to reauthenticate
        if (!password) {
          setError("Please enter your password.");
          setLoading(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
        isAuthenticated = true;
      }

      if (!isAuthenticated) {
        setError("Authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      // Show final confirmation dialog
      Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete your account? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes, Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const userId = user.uid;

                // Delete user data from Firestore
                await deleteDoc(doc(FIREBASE_DB, "users", userId));

                // Log deletion reason
                await setDoc(doc(FIREBASE_DB, "accountDeletions", userId), {
                  reason: reasonToSubmit,
                  deletedAt: new Date().toISOString(),
                  email: user.email,
                  authProvider: user.providerData[0]?.providerId || "unknown",
                });

                // Delete the user account
                await user.delete();
                Alert.alert(
                  "Account Deleted",
                  "Your account has been successfully deleted."
                );
              } catch (error) {
                console.error("Error deleting account:", error);
                setError(
                  "There was an error deleting your account. Please try again."
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Account deletion error:", error);
      setError(
        "Authentication failed. Please ensure your credentials are correct."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.textPrimary }]}>
          Delete Account
        </Text>
        <Text style={[styles.subTitle, { color: currentTheme.textSecondary }]}>
          We're sorry to see you go. Please let us know why you're leaving:
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {reasons.map((reason, index) => (
          <Pressable
            key={index}
            style={[
              styles.radioContainer,
              {
                backgroundColor:
                  selectedReason === reason
                    ? currentTheme.alternate + "20"
                    : "transparent",
                borderColor:
                  selectedReason === reason
                    ? currentTheme.alternate
                    : currentTheme.inactive,
              },
            ]}
            onPress={() => setSelectedReason(reason)}
          >
            <Ionicons
              name={
                selectedReason === reason
                  ? "radio-button-on"
                  : "radio-button-off"
              }
              size={24}
              color={
                selectedReason === reason
                  ? currentTheme.alternate
                  : currentTheme.secondary
              }
            />
            <Text
              style={[styles.radioLabel, { color: currentTheme.textPrimary }]}
            >
              {reason}
            </Text>
          </Pressable>
        ))}

        {selectedReason === "Other" && (
          <TextInput
            style={[
              styles.textInput,
              {
                color: currentTheme.textPrimary,
                borderColor: currentTheme.inactive,
                backgroundColor: currentTheme.accentBackground,
              },
            ]}
            placeholder="Please specify your reason"
            placeholderTextColor={currentTheme.secondary}
            value={otherReason}
            onChangeText={(text) => setOtherReason(text)}
            multiline
          />
        )}

        {!currentUser?.providerData.some(
          (provider: { providerId: string }) =>
            provider.providerId === "google.com"
        ) && (
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: currentTheme.textPrimary,
                  borderColor: currentTheme.inactive,
                  backgroundColor: currentTheme.accentBackground,
                  marginTop: 20,
                  paddingRight: 50,
                },
              ]}
              placeholder="Enter password to confirm"
              placeholderTextColor={currentTheme.secondary}
              value={password}
              onChangeText={(text) => setPassword(text)}
              secureTextEntry={!passwordVisible}
            />
            <Pressable
              style={styles.eyeIcon}
              onPress={() => setPasswordVisible(!passwordVisible)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={passwordVisible ? "eye-off" : "eye"}
                size={24}
                color={currentTheme.secondary}
              />
            </Pressable>
          </View>
        )}

        <Pressable
          style={[
            styles.deleteButton,
            {
              backgroundColor: "#FF3B30" + "20",
            },
          ]}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </Pressable>
      </ScrollView>

      {error && (
        <Text style={[styles.errorText, { color: currentTheme.error }]}>
          {error}
        </Text>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.alternate} />
        </View>
      )}
    </SafeAreaView>
  );
};

export default DeleteAccount;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 10,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  textInput: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 50,
  },
  deleteButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#FF3B30",
  },
  passwordContainer: {
    position: "relative",
    width: "100%",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 32,
    padding: 4,
  },
  errorText: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});
