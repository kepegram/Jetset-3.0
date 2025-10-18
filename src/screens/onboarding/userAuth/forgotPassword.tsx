import {
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
} from "react-native";
import React, { useState } from "react";
import { FIREBASE_AUTH } from "@/firebase.config";
import { sendPasswordResetEmail } from "firebase/auth";
import { lightTheme as theme } from "@/src/theme/theme";
import { MainButton } from "@/src/components/button";
import { Ionicons } from "@expo/vector-icons";

const ForgotPassword: React.FC = () => {
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
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.formContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {feedbackMessage && (
            <Text
              style={[
                styles.feedbackMessage,
                {
                  color: feedbackMessage.includes("Failed")
                    ? theme.error
                    : theme.alternate,
                  backgroundColor: feedbackMessage.includes("Failed")
                    ? theme.errorLight15
                    : theme.alternateLight15,
                },
              ]}
            >
              {feedbackMessage}
            </Text>
          )}

          <MainButton
            style={styles.resetButton}
            onPress={handlePasswordReset}
            disabled={loading || !email}
            width="100%"
          >
            {loading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <Text style={styles.resetButtonText}>Send Reset Link</Text>
            )}
          </MainButton>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    width: "100%",
    backgroundColor: "#fff",
  },
  headerContainer: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: theme.textSecondary,
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 25,
    marginBottom: 4,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
    height: 52,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 52,
    color: theme.textPrimary,
    fontSize: 15,
  },
  resetButton: {
    marginTop: 8,
  },
  resetButtonText: {
    color: theme.buttonText,
    fontSize: 17,
    fontWeight: "600",
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
