import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/firebase.config";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
} from "firebase/auth";
import { TextInput } from "react-native-gesture-handler";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { lightTheme as theme } from "@/src/theme/theme";
import { MainButton } from "@/src/components/button";
import { setDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LoginProps {
  onSwitchToSignUp?: () => void;
  onAuthSuccess?: () => Promise<void>;
  onSwitchToForgotPassword?: () => void;
}

const Login: React.FC<LoginProps> = ({
  onSwitchToSignUp,
  onAuthSuccess,
  onSwitchToForgotPassword,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  WebBrowser.maybeCompleteAuthSession();
  const [googleRequest, googleResponse, promptGoogle] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    const signInWithGoogleResponse = async () => {
      if (googleResponse?.type === "success") {
        try {
          const idToken = googleResponse.authentication?.idToken;
          if (!idToken) {
            setError("Google authentication failed. Please try again.");
            return;
          }
          const credential = GoogleAuthProvider.credential(idToken);
          const authResult = await signInWithCredential(auth, credential);

          await AsyncStorage.multiSet([
            ["userId", authResult.user.uid],
            ["userEmail", authResult.user.email || ""],
            [
              "userName",
              authResult.user.displayName ||
                (authResult.user.email
                  ? authResult.user.email.split("@")[0]
                  : "User"),
            ],
          ]);

          const userRef = doc(db, "users", authResult.user.uid);
          await setDoc(
            userRef,
            {
              name:
                authResult.user.displayName ||
                (authResult.user.email
                  ? authResult.user.email.split("@")[0]
                  : "User"),
              email: authResult.user.email,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              provider: "google",
            },
            { merge: true }
          );

          if (onAuthSuccess) {
            await onAuthSuccess();
          }
        } catch (e: any) {
          console.error("Google Sign-In Error:", e);
          setError("Error authenticating with Google, please try again.");
        }
      }
    };
    signInWithGoogleResponse();
  }, [googleResponse]);

  const handleGoogleSignIn = async () => {
    setError("");
    await promptGoogle();
  };

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
    const validationError = validateEmail(text);
    setEmailError(validationError);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      Alert.alert("Invalid Email", emailValidationError);
      setLoading(false);
      return;
    }

    if (password === "") {
      Alert.alert("Missing Password", "Password is required");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      await AsyncStorage.multiSet([
        ["userId", userCredential.user.uid],
        ["userEmail", userCredential.user.email || ""],
        ["userName", userCredential.user.displayName || email.split("@")[0]],
      ]);

      if (onAuthSuccess) {
        await onAuthSuccess();
      }
    } catch (error: any) {
      Alert.alert(
        "Login Error",
        error.message.includes("auth/invalid-credential")
          ? "Invalid email or password"
          : error.message.replace("Firebase: ", "")
      );
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
              onPress={handleAppleSignIn}
              activeOpacity={0.8}
            >
              <FontAwesome name="apple" size={32} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
              disabled={!googleRequest}
            >
              <FontAwesome name="google" size={28} color="#DB4437" />
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
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
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
            <TouchableOpacity
              onPress={onSwitchToForgotPassword}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <MainButton
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading || !email || emailError !== null}
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
    backgroundColor: "#F8F5F0",
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
  },
  socialButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 16,
    width: 130,
    height: 66,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    transform: [{ rotate: "-1deg" }],
  },
  googleIcon: {
    width: 28,
    height: 28,
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
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    marginBottom: 4,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    height: 52,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 52,
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
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginRight: 4,
  },
  forgotPasswordText: {
    color: theme.alternate,
    fontSize: 14,
    fontWeight: "500",
  },
});

export default Login;
