import {
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Dimensions,
} from "react-native";
import React, { useState } from "react";
import { FIREBASE_AUTH } from "../../../../firebase.config";
import { sendPasswordResetEmail } from "firebase/auth";
import { useTheme } from "../../../context/themeContext";
import { MainButton } from "../../../components/ui/button";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const ForgotPassword: React.FC = () => {
  const { currentTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const auth = FIREBASE_AUTH;

  const handlePasswordReset = async () => {
    if (!email) {
      setFeedbackMessage("Please enter your email address");
      return;
    }

    setLoading(true);
    setFeedbackMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setFeedbackMessage(
        "Password reset link sent! If email exists in our system, check your email."
      );
      console.log("Password reset link sent to: ", email);
    } catch (err) {
      console.log(err);
      setFeedbackMessage("Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="lock-closed"
              size={40}
              color={currentTheme.alternate}
            />
          </View>
          <Text style={[styles.title, { color: currentTheme.textPrimary }]}>
            Forgot Password?
          </Text>
          <Text
            style={[styles.subtitle, { color: currentTheme.textSecondary }]}
          >
            Enter your email and we'll send you a link to reset your password
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text
            style={[styles.inputHeader, { color: currentTheme.textPrimary }]}
          >
            Email Address
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={currentTheme.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: currentTheme.accentBackground,
                  color: currentTheme.textPrimary,
                  borderColor: currentTheme.inactive,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={currentTheme.textSecondary}
              value={email}
              onChangeText={(text) => setEmail(text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {feedbackMessage && (
            <Text
              style={[
                styles.feedbackMessage,
                {
                  color: feedbackMessage.includes("Failed")
                    ? currentTheme.error
                    : currentTheme.alternate,
                  backgroundColor: feedbackMessage.includes("Failed")
                    ? currentTheme.errorLight15
                    : currentTheme.alternateLight15,
                },
              ]}
            >
              {feedbackMessage}
            </Text>
          )}

          <View style={styles.buttonContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={currentTheme.primary} />
            ) : (
              <MainButton
                onPress={handlePasswordReset}
                buttonText="Send Reset Link"
                width="100%"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: width * 0.8,
  },
  formContainer: {
    width: "100%",
  },
  inputHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
    marginBottom: 20,
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    top: 18,
    zIndex: 1,
  },
  input: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 48,
    borderWidth: 1,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 16,
  },
  feedbackMessage: {
    marginBottom: 16,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    padding: 12,
    borderRadius: 8,
  },
});
