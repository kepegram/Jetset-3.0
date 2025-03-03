import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../App";
import { Ionicons } from "@expo/vector-icons";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../../../firebase.config";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { AuthRequestPromptOptions, AuthSessionResult } from "expo-auth-session";
import { MainButton } from "../../../components/ui/button";
import { setDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface LoginProps {
  promptAsync: (
    options?: AuthRequestPromptOptions
  ) => Promise<AuthSessionResult>;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_SMALL_DEVICE = SCREEN_HEIGHT < 700;

const Login: React.FC<LoginProps> = ({ promptAsync }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const auth = FIREBASE_AUTH;
  const db = FIREBASE_DB;

  const navigation = useNavigation<LoginScreenNavigationProp>();

  const isFormValid = email !== "" && password !== "";

  const handleLogin = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setErrorMessage(
        "Login failed. Incorrect username or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    promptAsync();
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
          setErrorMessage("Authentication failed. Please try again.");
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
        setErrorMessage("Cancelled Apple sign-in flow");
      } else {
        setErrorMessage("Error authenticating with Apple, please try again.");
      }
      console.error("Apple Sign-In Error:", e);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleSignUpNavigation = () => {
    navigation.navigate("SignUp");
  };

  return (
    <KeyboardAvoidingView
      testID="login-screen"
      style={[styles.container, { backgroundColor: "#F8F9FA" }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.scrollContainer}>
        <View testID="login-header" style={styles.headerContainer}>
          <Image
            source={require("../../../assets/icons/adaptive-icon.png")}
            style={styles.logo}
          />
          <Text
            testID="login-subtitle"
            style={[styles.subTitle, { color: "#1A1A1A" }]}
          >
            Welcome back, adventurer
          </Text>
        </View>

        <View testID="login-form" style={styles.loginContainer}>
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputHeader, { color: "#4A4A4A" }]}>
              Email
            </Text>
            <TextInput
              testID="login-email-input"
              style={[
                styles.input,
                {
                  backgroundColor: "white",
                  color: "#1A1A1A",
                  borderColor: "#E0E0E0",
                },
              ]}
              placeholder="user@example.com"
              placeholderTextColor="gray"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              autoComplete="email"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[styles.inputHeader, { color: "#4A4A4A" }]}>
              Password
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                testID="login-password-input"
                style={[
                  styles.input,
                  {
                    backgroundColor: "white",
                    color: "#1A1A1A",
                    borderColor: "#E0E0E0",
                  },
                ]}
                placeholder="••••••••••"
                placeholderTextColor="gray"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                editable={!loading}
                autoComplete="password"
              />
              <Pressable
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeIcon}
                disabled={loading}
              >
                <Ionicons
                  name={passwordVisible ? "eye-off" : "eye"}
                  size={24}
                  color="gray"
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            testID="forgot-password-button"
            onPress={handleForgotPassword}
            style={styles.forgotPasswordContainer}
            disabled={loading}
          >
            <Text
              testID="forgot-password-text"
              style={[styles.forgotPasswordText, { color: "#3BACE3" }]}
            >
              Forgot Password?
            </Text>
          </Pressable>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="black"
              style={styles.button}
            />
          ) : (
            <MainButton
              testID="login-submit-button"
              buttonText="Sign In"
              onPress={handleLogin}
              width="100%"
              disabled={loading || !isFormValid}
              style={[styles.button, !isFormValid && { opacity: 0.5 }]}
            />
          )}

          {errorMessage && (
            <Text
              testID="login-error-message"
              style={[styles.errorText, { color: "#FF4D4D" }]}
            >
              {errorMessage}
            </Text>
          )}
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: "#E0E0E0" }]} />
            <Text style={[styles.dividerText, { color: "#4A4A4A" }]}>
              or continue with
            </Text>
            <View style={[styles.divider, { backgroundColor: "#E0E0E0" }]} />
          </View>
        </View>

        <View style={styles.socialIconsContainer}>
          <MainButton
            testID="google-signin-button"
            onPress={handleGoogleLogin}
            backgroundColor="white"
            textColor="black"
            style={[styles.socialButton, { width: "100%" }]}
            disabled={loading}
          >
            <Image
              source={require("../../../assets/app-imgs/google.png")}
              style={styles.socialIcon}
            />
            <Text style={[styles.socialButtonText, { color: "black" }]}>
              Continue with Google
            </Text>
          </MainButton>

          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              testID="apple-signin-button"
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE
              }
              cornerRadius={12}
              style={styles.socialButton}
              onPress={() => handleAppleSignIn()}
            />
          )}
        </View>
        <Pressable
          testID="signup-link-button"
          onPress={handleSignUpNavigation}
          disabled={loading}
          style={[styles.loginLink, { opacity: loading ? 0.7 : 1 }]}
        >
          <Text testID="signup-link-text" style={styles.loginText}>
            New to Jetset?{" "}
            <Text style={{ fontWeight: "bold", color: "#3BACE3" }}>
              Sign up here
            </Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? (IS_SMALL_DEVICE ? 32 : 48) : 24,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: IS_SMALL_DEVICE ? 16 : 24,
  },
  logo: {
    width: IS_SMALL_DEVICE ? 60 : 70,
    height: IS_SMALL_DEVICE ? 60 : 70,
    marginBottom: IS_SMALL_DEVICE ? 8 : 12,
  },
  subTitle: {
    fontSize: IS_SMALL_DEVICE ? 18 : 20,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: IS_SMALL_DEVICE ? 4 : 8,
  },
  loginContainer: {
    width: "100%",
    marginBottom: IS_SMALL_DEVICE ? 8 : 12,
  },
  inputWrapper: {
    marginBottom: IS_SMALL_DEVICE ? 8 : 12,
  },
  inputHeader: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
    color: "#4A4A4A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    height: IS_SMALL_DEVICE ? 44 : 48,
    borderRadius: 25,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    fontSize: IS_SMALL_DEVICE ? 13 : 14,
    color: "#1A1A1A",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  passwordContainer: {
    position: "relative",
    width: "100%",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: IS_SMALL_DEVICE ? 8 : 12,
  },
  forgotPasswordText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3BACE3",
  },
  button: {
    width: "100%",
    marginBottom: IS_SMALL_DEVICE ? 8 : 12,
    height: IS_SMALL_DEVICE ? 44 : 48,
    borderRadius: 25,
    backgroundColor: "#3BACE3",
    shadowColor: "#3BACE3",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  errorText: {
    textAlign: "center",
    fontSize: 11,
    color: "#FF4D4D",
    marginBottom: IS_SMALL_DEVICE ? 8 : 12,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: IS_SMALL_DEVICE ? 8 : 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: "500",
    color: "#4A4A4A",
  },
  socialIconsContainer: {
    flexDirection: "column",
    gap: IS_SMALL_DEVICE ? 6 : 8,
    width: "100%",
  },
  socialButton: {
    height: IS_SMALL_DEVICE ? 44 : 48,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  socialIcon: {
    width: 18,
    height: 18,
  },
  socialButtonText: {
    fontSize: IS_SMALL_DEVICE ? 13 : 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  loginLink: {
    alignItems: "center",
    marginTop: IS_SMALL_DEVICE ? 4 : 8,
    marginBottom: IS_SMALL_DEVICE ? 8 : 12,
  },
  loginText: {
    fontSize: IS_SMALL_DEVICE ? 13 : 14,
    color: "#4A4A4A",
    textAlign: "center",
  },
});
