import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../../../firebase.config";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { AuthRequestPromptOptions, AuthSessionResult } from "expo-auth-session";
import { TextInput } from "react-native-gesture-handler";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { lightTheme as theme } from "../../../theme/theme";
import { MainButton } from "../../../components/ui/button";
import { setDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider } from "firebase/auth";

interface LoginProps {
  navigation?: any;
  route?: any;
}

const Login: React.FC<LoginProps> = ({ navigation, route }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const auth = FIREBASE_AUTH;
  const db = FIREBASE_DB;

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
    setError("");
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setLoading(false);
      return;
    }

    if (password === "") {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Store user info in AsyncStorage for persistence
      await AsyncStorage.multiSet([
        ["userId", userCredential.user.uid],
        ["userEmail", userCredential.user.email || ""],
        ["userName", userCredential.user.displayName || email.split("@")[0]],
      ]);

      // Navigation will be handled by the auth state listener in App.tsx
    } catch (error: any) {
      setError(
        error.message.includes("auth/invalid-credential")
          ? "Invalid email or password"
          : error.message.replace("Firebase: ", "")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log("🔍 Starting Google login process...");
    setLoading(true);
    setError("");

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log("✅ Google sign in successful!", userInfo);

      const { idToken, accessToken } = await GoogleSignin.getTokens();
      if (!idToken) {
        throw new Error("No ID token present");
      }

      console.log("🔑 Creating Firebase credential...");
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      console.log("✅ Firebase credential created");

      console.log("🔄 Attempting Firebase sign in...");
      const result = await signInWithCredential(FIREBASE_AUTH, credential);
      console.log("✅ Firebase sign in successful!");
    } catch (error: any) {
      console.error("❌ Google login error:", error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setError("Sign in was cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setError("Sign in is already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError("Play services not available");
      } else {
        setError(error.message || "Failed to login with Google");
      }
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

        const userRef = doc(db, "users", authResult.user.uid);
        await setDoc(
          userRef,
          {
            name: fullName?.givenName || "User",
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
              onPress={() => {
                console.log("Google button pressed");
                handleGoogleLogin();
              }}
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

            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <MainButton
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
            width="100%"
          >
            {loading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </MainButton>
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
    marginBottom: 12,
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 46,
    color: theme.textPrimary,
    fontSize: 15,
  },
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    minHeight: 20,
    marginBottom: 8,
  },
  loginButton: {
    marginBottom: 12,
  },
  loginButtonText: {
    color: theme.buttonText,
    fontSize: 18,
    fontWeight: "600",
  },
  inputWrapperError: {
    borderColor: theme.error,
  },
  errorContainer: {
    height: 20,
    justifyContent: "center",
  },
  fieldError: {
    fontSize: 12,
    marginLeft: 4,
    minHeight: 16,
  },
});

export default Login;
