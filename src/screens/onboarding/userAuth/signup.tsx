import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../../../firebase.config";
import { OAuthProvider, signInWithCredential } from "firebase/auth";
import { AuthRequestPromptOptions, AuthSessionResult } from "expo-auth-session";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { lightTheme as theme } from "../../../theme/theme";
import { MainButton } from "../../../components/ui/button";
import * as AppleAuthentication from "expo-apple-authentication";
import { RootStackParamList } from "../../../../App";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

type SignUpScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SignUp"
>;

interface SignUpProps {
  promptAsync: (
    options?: AuthRequestPromptOptions
  ) => Promise<AuthSessionResult>;
  onSwitchToLogin?: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ promptAsync, onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [tempUserId, setTempUserId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const navigation = useNavigation<SignUpScreenNavigationProp>();

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
        // Update verification status
        await updateDoc(verificationRef, {
          verified: true,
        });

        // Create a new user document with a unique ID
        const userDocRef = doc(FIREBASE_DB, "users", tempUserId);
        await setDoc(userDocRef, {
          email: email.toLowerCase(),
          username: getDisplayName(email),
          createdAt: new Date().toISOString(),
          emailVerified: true,
          lastLoginAt: new Date().toISOString(),
        });

        // Store essential user data in AsyncStorage
        await AsyncStorage.multiSet([
          ["userId", tempUserId],
          ["userEmail", email.toLowerCase()],
          ["userName", getDisplayName(email)],
        ]);

        // Show success message and redirect to login
        alert("Email verified successfully! Please log in with your email.");
        if (navigation) {
          navigation.navigate("Login");
        }
      } else {
        await updateDoc(verificationRef, {
          attempts: data.attempts + 1,
        });
        setError("Invalid verification code. Please try again.");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setError("Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const auth = FIREBASE_AUTH;

  const validateEmail = (email: string) => {
    if (!email) return "Email is required";
    if (!email.includes("@")) return "Email must contain @";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError(validateEmail(text));
  };

  const getDisplayName = (email: string) => {
    return email.split("@")[0];
  };

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError("");

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setLoading(false);
      return;
    }

    try {
      const verificationCode = generateVerificationCode();
      const newTempUserId = Math.random().toString(36).substring(2);
      setTempUserId(newTempUserId);

      const verificationRef = doc(
        FIREBASE_DB,
        "verificationCodes",
        newTempUserId
      );
      await setDoc(verificationRef, {
        code: verificationCode,
        email: email.trim(),
        createdAt: new Date().toISOString(),
        attempts: 0,
        verified: false,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

      setShowVerification(true);
      console.log("Verification code for testing:", verificationCode);
    } catch (error: any) {
      setError(error.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError("");

      await promptAsync();
    } catch (error) {
      setError("Error signing up with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential) {
        const { identityToken, fullName, email } = credential;

        if (!identityToken) {
          setError("Authentication failed. Please try again.");
          return;
        }

        const provider = new OAuthProvider("apple.com");
        const appleCredential = provider.credential({
          idToken: identityToken,
        });

        const authResult = await signInWithCredential(auth, appleCredential);

        const userRef = doc(FIREBASE_DB, "users", authResult.user.uid);
        await setDoc(
          userRef,
          {
            username: fullName?.givenName || "User",
            email: email || authResult.user.email,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );

        await AsyncStorage.setItem("userName", fullName?.givenName || "User");
      }
    } catch (e: any) {
      if (e.code === "ERR_REQUEST_CANCELED") {
        setError("Cancelled Apple sign-in flow");
      } else {
        setError("Error authenticating with Apple, please try again.");
      }
      console.error("Apple Sign-In Error:", e);
    }
  };

  if (showVerification) {
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.verificationContainer}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => setShowVerification(false)}
                style={styles.backButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.verificationContent}>
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.description}>
                Enter the 6-digit code sent to{"\n"}
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
                    onPress={resendDisabled ? undefined : handleSignUp}
                  >
                    {resendDisabled ? `Resend in ${countdown}s` : "Resend code"}
                  </Text>
                </Text>
              </View>
            </View>

            <View style={styles.verifyButtonContainer}>
              <MainButton
                style={styles.verifyButton}
                onPress={handleVerifyCode}
                disabled={loading || verificationCode.some((digit) => !digit)}
                width="100%"
              >
                {loading ? (
                  <ActivityIndicator color={theme.buttonText} />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </MainButton>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.formContainer}>
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignUp}
              activeOpacity={0.8}
            >
              <FontAwesome name="google" size={32} color="#EA4335" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleAppleSignIn}
              activeOpacity={0.8}
            >
              <FontAwesome name="apple" size={36} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  emailError && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={emailError ? theme.error : theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, emailError && { color: theme.error }]}
                  placeholder="Email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              <View style={styles.errorContainer}>
                <Text style={[styles.fieldError, { color: theme.error }]}>
                  {emailError || " "}
                </Text>
              </View>
            </View>

            {error && !emailError ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </View>

          <MainButton
            style={styles.signupButton}
            onPress={handleSignUp}
            disabled={loading}
            width="100%"
          >
            {loading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <Text style={styles.signupButtonText}>Continue with Email</Text>
            )}
          </MainButton>

          <Text style={styles.termsText}>
            By signing up, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
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
    flex: 1,
    padding: 20,
  },
  formContainer: {
    width: "100%",
    backgroundColor: "#fff",
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
    width: "100%",
    gap: 16,
    paddingHorizontal: 20,
  },
  socialButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    width: 130,
    height: 66,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e9ecef",
  },
  dividerText: {
    paddingHorizontal: 12,
    color: theme.textSecondary,
    fontSize: 14,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 5,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    height: 46,
  },
  inputWrapperError: {
    borderColor: theme.error,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 15,
  },
  errorContainer: {
    height: 20,
    justifyContent: "center",
  },
  fieldError: {
    fontSize: 12,
    marginLeft: 4,
    color: theme.error,
    minHeight: 16,
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  signupButton: {
    marginBottom: 12,
  },
  signupButtonText: {
    color: theme.buttonText,
    fontSize: 17,
    fontWeight: "600",
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    color: theme.textSecondary,
  },
  termsLink: {
    color: theme.alternate,
    fontWeight: "bold",
  },
  verificationContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  verificationContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  emailText: {
    color: theme.textPrimary,
    fontWeight: "600",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  codeInput: {
    width: 45,
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
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
    marginBottom: 20,
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
  verifyButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  verifyButton: {
    width: "100%",
  },
  buttonText: {
    color: theme.buttonText,
    fontSize: 17,
    fontWeight: "600",
  },
});

export default SignUp;
