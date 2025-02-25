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
      style={[styles.container, { backgroundColor: "white" }]}
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
            style={[styles.subTitle, { color: "black" }]}
          >
            Welcome back, adventurer
          </Text>
        </View>

        <View testID="login-form" style={styles.loginContainer}>
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputHeader, { color: "black" }]}>Email</Text>
            <TextInput
              testID="login-email-input"
              style={[
                styles.input,
                {
                  backgroundColor: "white",
                  color: "black",
                  borderColor: "gray",
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
            <Text style={[styles.inputHeader, { color: "black" }]}>
              Password
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                testID="login-password-input"
                style={[
                  styles.input,
                  {
                    backgroundColor: "white",
                    color: "black",
                    borderColor: "gray",
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
              style={[styles.errorText, { color: "red" }]}
            >
              {errorMessage}
            </Text>
          )}
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: "gray" }]} />
            <Text style={[styles.dividerText, { color: "black" }]}>
              or continue with
            </Text>
            <View style={[styles.divider, { backgroundColor: "gray" }]} />
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
    backgroundColor: "white",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  subTitle: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  loginContainer: {
    width: "100%",
    marginTop: 20,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  passwordContainer: {
    position: "relative",
    width: "100%",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 4,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    width: "100%",
    marginBottom: 16,
  },
  errorText: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 16,
  },
  createAccountContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  createAccountText: {
    fontSize: 15,
  },
  signUpLink: {
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  socialIconsContainer: {
    flexDirection: "column",
    gap: 12,
    width: "100%",
  },
  socialButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "black",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  socialIcon: {
    width: 16,
    height: 16,
  },
  socialButtonText: {
    fontSize: 20,
    fontWeight: "600",
  },
  loginLink: {
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
