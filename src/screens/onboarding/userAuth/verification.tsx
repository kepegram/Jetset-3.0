import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { lightTheme as theme } from "../../../theme/theme";
import { MainButton } from "../../../components/ui/button";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../../../firebase.config";
import { doc, getDoc, deleteDoc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface VerificationProps {
  email: string;
  tempUserId: string;
  onBackToSignup?: () => void;
  onAuthSuccess?: () => Promise<void>;
}

const Verification: React.FC<VerificationProps> = ({
  email,
  tempUserId,
  onBackToSignup,
  onAuthSuccess,
}) => {
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendDisabled && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(30);
    }
    return () => clearInterval(timer);
  }, [resendDisabled, countdown]);

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text[text.length - 1];
    }

    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);

    if (text !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (
      e.nativeEvent.key === "Backspace" &&
      index > 0 &&
      verificationCode[index] === ""
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const getDisplayName = (email: string) => {
    return email.split("@")[0];
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.join("") || verificationCode.join("").length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const verificationRef = doc(FIREBASE_DB, "verificationCodes", tempUserId);
      const verificationDoc = await getDoc(verificationRef);

      if (!verificationDoc.exists()) {
        setError("Verification code has expired. Please try again.");
        return;
      }

      const data = verificationDoc.data();
      const now = new Date();
      const expiresAt = new Date(data.expiresAt);

      if (now > expiresAt) {
        setError("Verification code has expired. Please try again.");
        return;
      }

      if (data.attempts >= 3) {
        setError("Too many attempts. Please request a new code.");
        return;
      }

      if (data.code === verificationCode.join("")) {
        // Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          FIREBASE_AUTH,
          data.email,
          data.password
        );

        // Create a new user document
        const userDocRef = doc(FIREBASE_DB, "users", userCredential.user.uid);
        await setDoc(userDocRef, {
          email: data.email.toLowerCase(),
          username: getDisplayName(data.email),
          createdAt: new Date().toISOString(),
          emailVerified: true,
          lastLoginAt: new Date().toISOString(),
        });

        // Store essential user data in AsyncStorage
        await AsyncStorage.multiSet([
          ["userId", userCredential.user.uid],
          ["userEmail", data.email.toLowerCase()],
          ["userName", getDisplayName(data.email)],
        ]);

        // Clean up verification document
        await deleteDoc(verificationRef);

        if (onAuthSuccess) {
          await onAuthSuccess();
        }
      } else {
        await setDoc(
          verificationRef,
          {
            ...data,
            attempts: data.attempts + 1,
          },
          { merge: true }
        );
        setError("Invalid verification code. Please try again.");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setError("Failed to verify code. Please try again.");
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
        <Text style={styles.description}>
          For added security, please enter the 6-digit code sent to{"\n"}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <View style={styles.codeContainer}>
          {verificationCode.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled,
                error && styles.codeInputError,
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            Didn't receive the code?{" "}
            <Text
              style={[
                styles.resendButton,
                resendDisabled && styles.resendButtonDisabled,
              ]}
              onPress={resendDisabled ? undefined : onBackToSignup}
            >
              {resendDisabled ? `Resend in ${countdown}s` : "Resend code"}
            </Text>
          </Text>
        </View>

        <MainButton
          style={styles.verifyButton}
          onPress={handleVerifyCode}
          disabled={loading || verificationCode.some((digit) => !digit)}
          width="100%"
        >
          {loading ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Text style={styles.buttonText}>Complete Sign Up</Text>
          )}
        </MainButton>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    padding: 20,
  },
  description: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  emailText: {
    color: theme.alternate,
    fontWeight: "600",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  codeInput: {
    width: 52,
    height: 64,
    borderWidth: 1.5,
    borderRadius: 16,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
    color: theme.textPrimary,
  },
  codeInputFilled: {
    borderColor: theme.alternate,
    backgroundColor: "#fff",
  },
  codeInputError: {
    borderColor: theme.error,
    backgroundColor: "#fff",
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  resendText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  resendButton: {
    color: theme.alternate,
    fontWeight: "600",
  },
  resendButtonDisabled: {
    color: theme.textSecondary,
    opacity: 0.6,
  },
  verifyButton: {
    width: "100%",
  },
  buttonText: {
    color: theme.buttonText,
    fontSize: 17,
    fontWeight: "600",
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
});

export default Verification;
