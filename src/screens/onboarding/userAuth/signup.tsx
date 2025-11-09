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
  Image,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/firebase.config";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  OAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { lightTheme as theme } from "@/src/theme/theme";
import { MainButton } from "@/src/components/button";
import * as AppleAuthentication from "expo-apple-authentication";
import { RootStackParamList } from "@/App";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import {
  fetchSignInMethodsForEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";

type SignUpScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SignUp"
>;

interface SignUpProps {
  onSwitchToLogin?: () => void;
  onAuthSuccess?: () => Promise<void>;
  onStartVerification?: (email: string, tempUserId: string) => void;
}

const SignUp: React.FC<SignUpProps> = ({
  onSwitchToLogin,
  onAuthSuccess,
  onStartVerification,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

          const userRef = doc(FIREBASE_DB, "users", authResult.user.uid);
          await setDoc(
            userRef,
            {
              username:
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
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

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
        const userCredential = await createUserWithEmailAndPassword(
          FIREBASE_AUTH,
          data.email,
          data.password
        );

        const userDocRef = doc(FIREBASE_DB, "users", userCredential.user.uid);
        await setDoc(userDocRef, {
          email: data.email.toLowerCase(),
          username: getDisplayName(data.email),
          createdAt: new Date().toISOString(),
          emailVerified: true,
          lastLoginAt: new Date().toISOString(),
        });

        await AsyncStorage.multiSet([
          ["userId", userCredential.user.uid],
          ["userEmail", data.email.toLowerCase()],
          ["userName", getDisplayName(data.email)],
        ]);

        await deleteDoc(verificationRef);

        if (onAuthSuccess) {
          await onAuthSuccess();
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
    const validationError = validateEmail(text);
    setEmailError(validationError);
  };

  const getDisplayName = (email: string) => {
    return email.split("@")[0];
  };

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    setPasswordRequirements(requirements);

    if (!requirements.length) {
      return "Password must be at least 8 characters long";
    }
    if (!requirements.uppercase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!requirements.lowercase) {
      return "Password must contain at least one lowercase letter";
    }
    if (!requirements.number) {
      return "Password must contain at least one number";
    }
    if (!requirements.special) {
      return "Password must contain at least one special character";
    }

    return null;
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    const validationError = validatePassword(text);
    setPasswordError(validationError);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError("");

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      Alert.alert("Invalid Email", emailValidationError);
      setLoading(false);
      return;
    }

    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      Alert.alert("Invalid Password", passwordValidationError);
      setLoading(false);
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        Alert.alert("Error", "An account with this email already exists");
        setLoading(false);
        return;
      }

      const verificationCode = generateVerificationCode();
      const newTempUserId = Math.random().toString(36).substring(2);

      const verificationRef = doc(
        FIREBASE_DB,
        "verificationCodes",
        newTempUserId
      );
      await setDoc(verificationRef, {
        code: verificationCode,
        email: email.trim(),
        password: password,
        createdAt: new Date().toISOString(),
        attempts: 0,
        verified: false,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        const docSnapshot = await getDoc(verificationRef);
        const data = docSnapshot.data();

        if (data?.emailSent === true) {
          if (onStartVerification) {
            onStartVerification(email, newTempUserId);
          }
          break;
        } else if (data?.emailSent === false) {
          throw new Error(
            "Failed to send verification code. Please try again."
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error(
          "Verification email is taking too long. Please try again."
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Signup Error",
        error.message || "An error occurred during signup. Please try again."
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
                  name="chevron-back"
                  size={28}
                  color={theme.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.verificationContent}>
              <Text style={styles.title}>Two-Factor Authentication</Text>
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
                  <Text style={styles.buttonText}>Complete Sign Up</Text>
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
                onChangeText={handlePasswordChange}
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

            {password.length > 0 &&
              !Object.values(passwordRequirements).every(Boolean) && (
                <View style={styles.passwordRequirements}>
                  <Text
                    style={[
                      styles.requirementText,
                      passwordRequirements.length && styles.requirementMet,
                    ]}
                  >
                    • At least 8 characters
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      passwordRequirements.uppercase && styles.requirementMet,
                    ]}
                  >
                    • One uppercase letter
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      passwordRequirements.lowercase && styles.requirementMet,
                    ]}
                  >
                    • One lowercase letter
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      passwordRequirements.number && styles.requirementMet,
                    ]}
                  >
                    • One number
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      passwordRequirements.special && styles.requirementMet,
                    ]}
                  >
                    • One special character
                  </Text>
                </View>
              )}
          </View>

          <MainButton
            style={styles.signupButton}
            onPress={handleSignUp}
            disabled={
              loading ||
              !email ||
              emailError !== null ||
              !password ||
              passwordError !== null
            }
            width="100%"
          >
            {loading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <Text style={styles.signupButtonText}>Sign Up</Text>
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
    transform: [{ rotate: "1deg" }],
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
    height: 52,
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
  },
  backButton: {
    padding: 0,
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
    marginBottom: 14,
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
    width: 55,
    height: 75,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    backgroundColor: "#FAFAFA",
    borderColor: "#E8E8E8",
    color: theme.textPrimary,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  googleIcon: {
    width: 28,
    height: 28,
  },
  eyeIcon: {
    padding: 10,
  },
  passwordRequirements: {
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 15,
  },
  requirementText: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  requirementMet: {
    color: theme.alternate,
  },
});

export default SignUp;
