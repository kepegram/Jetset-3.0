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
        style={[styles.contentContainer, { backgroundColor: "white" }]}
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
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "flex-start",
    paddingTop: 0,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 22,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 42,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    letterSpacing: 0.3,
    color: "black",
  },
  signUpContainer: {
    marginBottom: 16,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 50,
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
    top: 10,
    padding: 4,
  },
  button: {
    width: "100%",
    marginTop: 16,
  },
  errorText: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "red",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1.5,
    backgroundColor: "grey",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
    color: "grey",
  },
  socialButtonsContainer: {
    flexDirection: "column",
    gap: 12,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    marginBottom: 16,
  },
  socialButton: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "black",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialButtonText: {
    fontSize: 19,
    fontWeight: "600",
  },
  loginLink: {
    alignItems: "center",
  },
  loginText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
