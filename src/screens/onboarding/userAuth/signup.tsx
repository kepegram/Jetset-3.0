import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../../../firebase.config";
import { doc, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  OAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../../../App";
import { AuthRequestPromptOptions, AuthSessionResult } from "expo-auth-session";
import * as AppleAuthentication from "expo-apple-authentication";
import { MainButton } from "../../../components/ui/button";

type SignUpScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SignUp"
>;

interface SignUpProps {
  promptAsync: (
    options?: AuthRequestPromptOptions
  ) => Promise<AuthSessionResult>;
}

interface InputFieldProps {
  label: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
  editable?: boolean;
  testID?: string;
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  visible: boolean;
  toggleVisible: () => void;
  editable: boolean;
  testID?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_SMALL_DEVICE = SCREEN_HEIGHT < 700;

const InputField: React.FC<InputFieldProps> = ({ label, ...props }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput style={styles.input} placeholderTextColor={"grey"} {...props} />
  </View>
);

const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  value,
  onChangeText,
  visible,
  toggleVisible,
  editable,
  testID,
}) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.passwordContainer}>
      <TextInput
        style={styles.input}
        placeholder="••••••••••"
        placeholderTextColor={"grey"}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
        editable={editable}
        testID={testID}
      />
      <Pressable
        style={styles.eyeIcon}
        onPress={toggleVisible}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name={visible ? "eye-off" : "eye"} size={24} color={"grey"} />
      </Pressable>
    </View>
  </View>
);

const SignUp: React.FC<SignUpProps> = ({ promptAsync }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const auth = FIREBASE_AUTH;
  const db = FIREBASE_DB;

  const navigation = useNavigation<SignUpScreenNavigationProp>();

  const isFormValid = username && email && password && confirmPassword;

  const handleSignUp = async () => {
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = response.user;

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        username: username,
        email: email,
        createdAt: new Date().toISOString(),
      });

      await AsyncStorage.setItem("userName", username);
    } catch (err: any) {
      console.error("Error signing up:", err);
      const user = auth.currentUser;
      if (user) {
        await deleteUser(user);
      }
      if (err.code === "auth/weak-password") {
        setErrorMessage("Please assure password is at least 6 characters.");
      } else {
        setErrorMessage("Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
        setErrorMessage("Cancelled Apple sign-in flow");
      } else {
        setErrorMessage("Error authenticating with Apple, please try again.");
      }
      console.error("Apple Sign-In Error:", e);
    }
  };

  const handleLoginNavigation = () => {
    navigation.navigate("Login");
  };

  return (
    <SafeAreaView testID="signup-screen" style={styles.container}>
      <KeyboardAvoidingView
        testID="signup-content"
        style={[styles.contentContainer, { backgroundColor: "#F8F9FA" }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View testID="signup-header" style={styles.headerContainer}>
          <Image
            source={require("../../../assets/icons/adaptive-icon.png")}
            style={styles.logo}
          />
          <Text testID="signup-subtitle" style={styles.subtitle}>
            Your journey begins here
          </Text>
        </View>

        <View testID="signup-form" style={styles.signUpContainer}>
          <InputField
            testID="signup-username-input"
            label="Username"
            placeholder="johndoe123"
            value={username}
            onChangeText={setUsername}
            editable={!loading}
            autoCapitalize="none"
          />

          <InputField
            testID="signup-email-input"
            label="Email"
            placeholder="example@mail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <PasswordField
            testID="signup-password-input"
            label="Password"
            value={password}
            onChangeText={setPassword}
            visible={passwordVisible}
            toggleVisible={() => setPasswordVisible(!passwordVisible)}
            editable={!loading}
          />

          <PasswordField
            testID="signup-confirm-password-input"
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            visible={confirmPasswordVisible}
            toggleVisible={() =>
              setConfirmPasswordVisible(!confirmPasswordVisible)
            }
            editable={!loading}
          />

          <MainButton
            testID="signup-submit-button"
            buttonText="Create Account"
            onPress={handleSignUp}
            disabled={loading || !isFormValid}
            style={[styles.button, !isFormValid && { opacity: 0.5 }]}
          />

          {errorMessage && (
            <Text testID="signup-error-message" style={styles.errorText}>
              {errorMessage}
            </Text>
          )}
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialButtonsContainer}>
          <MainButton
            testID="google-signup-button"
            onPress={handleGoogleSignUp}
            backgroundColor="white"
            textColor="black"
            style={[styles.socialButton, { width: "100%" }]}
            disabled={loading}
          >
            <Image
              source={require("../../../assets/app-imgs/google.png")}
              style={styles.socialIcon}
            />
            <Text style={styles.socialButtonText}>Sign up with Google</Text>
          </MainButton>

          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              testID="apple-signup-button"
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE
              }
              cornerRadius={12}
              style={styles.socialButton}
              onPress={handleAppleSignIn}
            />
          )}
        </View>

        <Pressable
          testID="login-link-button"
          onPress={handleLoginNavigation}
          disabled={loading}
          style={[styles.loginLink, { opacity: loading ? 0.7 : 1 }]}
        >
          <Text testID="login-link-text" style={styles.loginText}>
            Already have an account?{" "}
            <Text style={{ fontWeight: "bold", color: "#3BACE3" }}>Log in</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? (IS_SMALL_DEVICE ? 8 : 16) : 8,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: IS_SMALL_DEVICE ? 12 : 16,
  },
  logo: {
    width: IS_SMALL_DEVICE ? 50 : 60,
    height: IS_SMALL_DEVICE ? 50 : 60,
    marginBottom: IS_SMALL_DEVICE ? 4 : 8,
  },
  subtitle: {
    fontSize: IS_SMALL_DEVICE ? 18 : 20,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: IS_SMALL_DEVICE ? 4 : 8,
  },
  signUpContainer: {
    marginBottom: IS_SMALL_DEVICE ? 8 : 12,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  inputWrapper: {
    marginBottom: IS_SMALL_DEVICE ? 8 : 12,
  },
  inputLabel: {
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
  button: {
    width: "100%",
    marginTop: IS_SMALL_DEVICE ? 8 : 12,
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
    marginTop: IS_SMALL_DEVICE ? 4 : 8,
    fontSize: 11,
    fontWeight: "500",
    color: "#FF4D4D",
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
  socialButtonsContainer: {
    flexDirection: "column",
    gap: IS_SMALL_DEVICE ? 6 : 8,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    marginBottom: IS_SMALL_DEVICE ? 8 : 12,
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
  },
  loginText: {
    fontSize: IS_SMALL_DEVICE ? 13 : 14,
    color: "#4A4A4A",
    textAlign: "center",
  },
});
