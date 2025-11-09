import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Pressable,
  Image,
  Modal,
  Dimensions,
  TouchableOpacity,
  Animated as RNAnimated,
  StatusBar,
  LayoutAnimation,
  Platform,
  Keyboard,
  KeyboardEvent,
} from "react-native";
import { MainButton } from "@/src/components/button";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { lightTheme } from "@/src/theme/theme";
import Terms from "@/src/screens/onboarding/terms/terms";
import Privacy from "@/src/screens/onboarding/privacy/privacy";
import Login from "@/src/screens/onboarding/userAuth/login";
import SignUp from "@/src/screens/onboarding/userAuth/signup";
import ForgotPassword from "@/src/screens/onboarding/userAuth/forgotPassword";
import Verification from "@/src/screens/onboarding/userAuth/verification";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/App";
import Ionicons from "@expo/vector-icons/Ionicons";

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

interface WelcomeProps {
  setBypassAuth?: (bypass: boolean) => void;
}

const Welcome: React.FC<WelcomeProps> = ({ setBypassAuth }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<
    "login" | "signup" | "forgotPassword" | "verification"
  >("login");
  const [slideAnim] = useState(
    new RNAnimated.Value(Dimensions.get("window").height)
  );
  const [opacityAnim] = useState(new RNAnimated.Value(0));
  const [scaleAnim] = useState(new RNAnimated.Value(1));
  const [translateAnim] = useState(new RNAnimated.Value(0));
  const [keyboardOffset] = useState(new RNAnimated.Value(0));
  const [verificationData, setVerificationData] = useState<{
    email: string;
    tempUserId: string;
  } | null>(null);

  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  const facts = [
    {
      title: "Capture Your Adventures 📸",
      description: "Create beautiful trip scrapbooks with photos",
      image: require("../../../assets/imgs/paris.jpg"),
      location: "Paris",
    },
    {
      title: "Organize Your Journeys 🗂️",
      description: "Keep all your travel memories organized",
      image: require("../../../assets/imgs/dubai.jpg"),
      location: "Dubai",
    },
    {
      title: "Share Your Stories 📖",
      description: "Document every excursion and experience",
      image: require("../../../assets/imgs/tokyo.jpg"),
      location: "Tokyo",
    },
    {
      title: "Never Forget 🌟",
      description: "Preserve your travel memories forever",
      image: require("../../../assets/imgs/sydney.jpg"),
      location: "Sydney",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % facts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const keyboardWillShow = (event: KeyboardEvent) => {
      RNAnimated.parallel([
        RNAnimated.timing(keyboardOffset, {
          toValue: -event.endCoordinates.height,
          duration: event.duration,
          useNativeDriver: true,
        }),
        RNAnimated.spring(slideAnim, {
          toValue: -event.endCoordinates.height,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
      ]).start();
    };

    const keyboardWillHide = (event: KeyboardEvent) => {
      RNAnimated.parallel([
        RNAnimated.timing(keyboardOffset, {
          toValue: 0,
          duration: event.duration,
          useNativeDriver: true,
        }),
        RNAnimated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
      ]).start();
    };

    const keyboardDidShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      keyboardWillShow
    );
    const keyboardDidHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      keyboardWillHide
    );

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, [keyboardOffset, slideAnim]);

  const handleTermsPress = () => {
    setShowTerms(true);
  };

  const handlePrivacyPress = () => {
    setShowPrivacy(true);
  };

  const handleAuthPress = () => {
    setShowAuthModal(true);
    StatusBar.setBarStyle("light-content");
    RNAnimated.parallel([
      RNAnimated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }),
      RNAnimated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      RNAnimated.spring(scaleAnim, {
        toValue: 0.88,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }),
      RNAnimated.spring(translateAnim, {
        toValue: 30,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }),
    ]).start();
  };

  const handleCloseAuthModal = () => {
    StatusBar.setBarStyle("dark-content");
    return new Promise<void>((resolve) => {
      RNAnimated.parallel([
        RNAnimated.spring(slideAnim, {
          toValue: Dimensions.get("window").height,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        RNAnimated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        RNAnimated.spring(translateAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
      ]).start(() => {
        setShowAuthModal(false);
        setAuthMode("login");
        resolve();
      });
    });
  };

  const handleSwitchAuthMode = (
    mode: "login" | "signup" | "forgotPassword" | "verification"
  ) => {
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setAuthMode(mode);
  };

  const handleAuthSuccess = async () => {
    await handleCloseAuthModal();
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: "AppNav" as const }],
      });
    }, 400);
  };

  useEffect(() => {
    return () => {
      StatusBar.setBarStyle("dark-content");
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.blackBackground} />
      <RNAnimated.View
        style={[
          styles.contentContainer,
          {
            transform: [{ scale: scaleAnim }, { translateY: translateAnim }],
            borderRadius: scaleAnim.interpolate({
              inputRange: [0.88, 1],
              outputRange: [20, 0],
            }),
            overflow: "hidden",
          },
        ]}
      >
        <View
          style={[
            styles.backgroundImage,
            { backgroundColor: lightTheme.background },
          ]}
        >
          <View style={styles.slide}>
            <View style={styles.topSection}>
              <View style={styles.carouselContainer}>
                <Animated.View
                  key={activeIndex}
                  entering={FadeIn.duration(800)}
                  exiting={FadeOut.duration(800)}
                  style={styles.factContainer}
                >
                  <View style={styles.polaroidWrapper}>
                    <View
                      style={[
                        styles.tapeEffect,
                        {
                          backgroundColor: "rgba(255, 220, 150, 0.7)",
                          top: -10,
                          right: 30,
                          transform: [{ rotate: "-45deg" }],
                        },
                      ]}
                    />
                    <ImageBackground
                      source={facts[activeIndex].image}
                      style={styles.factImage}
                      imageStyle={styles.factImageStyle}
                    >
                      <View style={styles.locationContainer}>
                        <Text style={styles.locationText}>
                          {facts[activeIndex].location}
                        </Text>
                      </View>
                    </ImageBackground>
                  </View>
                  <View style={styles.factContent}>
                    <Text style={styles.factTitle}>
                      {facts[activeIndex].title}
                    </Text>
                    <Text style={styles.factDescription}>
                      {facts[activeIndex].description}
                    </Text>
                  </View>
                </Animated.View>
              </View>
            </View>

            <View style={styles.middleSection}>
              <Image
                source={require("../../../assets/icons/adaptive-icon.png")}
                style={styles.logo}
              />
              <Text style={styles.appName}>Jetset</Text>

              <Text style={styles.slogan}>
                Capture. Organize.{" "}
                <Text style={styles.exploreText}>Remember.</Text>
              </Text>
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.buttonContainer}>
                <MainButton
                  onPress={handleAuthPress}
                  buttonText="Continue"
                  style={styles.continueButton}
                  textColor="white"
                />

                <TouchableOpacity
                  onPress={() => {
                    console.log("🧪 Bypassing login for testing...");
                    setBypassAuth?.(true);
                  }}
                  style={[styles.continueButton, { marginTop: 10 }]}
                >
                  <Text
                    style={{
                      color: "grey",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    🧪 Bypass Login (Testing)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  I have read and accepted Jetset's{" "}
                </Text>
                <View style={styles.termsRow}>
                  <Pressable onPress={handleTermsPress}>
                    <Text style={[styles.termsText, styles.termsLink]}>
                      Terms & Conditions
                    </Text>
                  </Pressable>
                  <Text style={styles.termsText}>and </Text>
                  <Pressable onPress={handlePrivacyPress}>
                    <Text style={[styles.termsText, styles.termsLink]}>
                      Privacy Policy
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </RNAnimated.View>

      <Modal
        visible={showTerms}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTerms(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Terms onClose={() => setShowTerms(false)} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPrivacy}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrivacy(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Privacy onClose={() => setShowPrivacy(false)} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAuthModal}
        animationType="none"
        transparent={true}
        onRequestClose={handleCloseAuthModal}
        statusBarTranslucent={true}
      >
        <RNAnimated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          ]}
        >
          <RNAnimated.View
            style={[
              styles.modalContent,
              authMode === "signup"
                ? styles.signupModalContent
                : authMode === "forgotPassword"
                ? styles.forgotPasswordModalContent
                : authMode === "verification"
                ? styles.verificationModalContent
                : styles.loginModalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.authModalHeader}>
              {(authMode === "forgotPassword" ||
                authMode === "verification") && (
                <TouchableOpacity
                  onPress={() =>
                    handleSwitchAuthMode(
                      authMode === "forgotPassword" ? "login" : "signup"
                    )
                  }
                  style={styles.backButton}
                >
                  <Ionicons
                    name="chevron-back"
                    size={24}
                    color={lightTheme.textPrimary}
                  />
                </TouchableOpacity>
              )}
              <Text style={styles.authModalTitle}>
                {authMode === "login"
                  ? "Login"
                  : authMode === "signup"
                  ? "Sign Up"
                  : authMode === "verification"
                  ? "Two-Factor Authentication"
                  : "Reset Password"}
              </Text>
              <TouchableOpacity
                onPress={handleCloseAuthModal}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={lightTheme.textPrimary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.authSwitchContainer}>
              {authMode === "login" ? (
                <View style={styles.authSwitchWrapper}>
                  <Text style={styles.authSwitchText}>
                    Don't have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleSwitchAuthMode("signup")}
                  >
                    <Text style={styles.authSwitchLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              ) : authMode === "signup" ? (
                <View style={styles.authSwitchWrapper}>
                  <Text style={styles.authSwitchText}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleSwitchAuthMode("login")}
                  >
                    <Text style={styles.authSwitchLink}>Log In</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
            <View style={styles.authModalBody}>
              {authMode === "login" ? (
                <Login
                  onSwitchToSignUp={() => handleSwitchAuthMode("signup")}
                  onAuthSuccess={handleAuthSuccess}
                  onSwitchToForgotPassword={() =>
                    handleSwitchAuthMode("forgotPassword")
                  }
                />
              ) : authMode === "signup" ? (
                <SignUp
                  onSwitchToLogin={() => handleSwitchAuthMode("login")}
                  onAuthSuccess={handleAuthSuccess}
                  onStartVerification={(email, tempUserId) => {
                    setVerificationData({ email, tempUserId });
                    handleSwitchAuthMode("verification");
                  }}
                />
              ) : authMode === "verification" && verificationData ? (
                <Verification
                  email={verificationData.email}
                  tempUserId={verificationData.tempUserId}
                  onBackToSignup={() => {
                    setVerificationData(null);
                    handleSwitchAuthMode("signup");
                  }}
                  onAuthSuccess={handleAuthSuccess}
                />
              ) : (
                <ForgotPassword />
              )}
            </View>
          </RNAnimated.View>
        </RNAnimated.View>
      </Modal>
    </View>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F5F0",
  },
  blackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F8F5F0",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#F8F5F0",
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    backgroundColor: "#F8F5F0",
  },
  slide: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  topSection: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 40,
  },
  middleSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  bottomSection: {
    width: "100%",
    paddingBottom: 10,
    gap: 8,
  },
  appName: {
    fontSize: 72,
    fontWeight: "bold",
    color: lightTheme.alternate,
    marginBottom: 10,
  },
  slogan: {
    fontSize: 18,
    textAlign: "center",
    color: lightTheme.textSecondary,
    paddingHorizontal: 20,
  },
  exploreText: {
    color: lightTheme.alternate,
    fontWeight: "bold",
  },
  carouselContainer: {
    alignItems: "center",
    width: "100%",
    paddingVertical: 20,
  },
  factContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    width: "100%",
  },
  polaroidWrapper: {
    position: "relative",
    width: "100%",
  },
  tapeEffect: {
    position: "absolute",
    width: 70,
    height: 26,
    zIndex: 10,
    borderRadius: 2,
  },
  factImage: {
    width: "100%",
    height: 220,
    borderRadius: 4,
    marginBottom: 20,
    justifyContent: "flex-end",
    backgroundColor: "#FAFAFA",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    transform: [{ rotate: "-2deg" }],
  },
  factImageStyle: {
    borderRadius: 2,
  },
  factContent: {
    padding: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ rotate: "1deg" }],
  },
  factTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 6,
  },
  factDescription: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  continueButton: {
    width: "80%",
    backgroundColor: "#FF6B6B",
    borderRadius: 30,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#FFF",
    transform: [{ rotate: "-1deg" }],
  },
  termsContainer: {
    alignItems: "center",
    opacity: 0.7,
    marginTop: 10,
    marginBottom: -20,
  },
  termsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  termsText: {
    fontSize: 13,
    color: lightTheme.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  termsLink: {
    color: lightTheme.alternate,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  locationContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  locationText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: -10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#E8E8E8",
  },
  loginModalContent: {
    height: Dimensions.get("window").height * 0.5,
  },
  signupModalContent: {
    height: Dimensions.get("window").height * 0.52,
  },
  forgotPasswordModalContent: {
    height: Dimensions.get("window").height * 0.37,
  },
  verificationModalContent: {
    height: Dimensions.get("window").height * 0.44,
  },
  authModalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    position: "relative",
  },
  authModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: lightTheme.textPrimary,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    padding: 8,
    zIndex: 1,
  },
  authSwitchContainer: {
    paddingBottom: 0,
  },
  authSwitchWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  authSwitchText: {
    fontSize: 15,
    color: lightTheme.textSecondary,
  },
  authSwitchLink: {
    fontSize: 15,
    color: lightTheme.alternate,
    fontWeight: "bold",
  },
  authModalBody: {
    flex: 1,
    overflow: "hidden",
  },
  backButton: {
    position: "absolute",
    left: 20,
    padding: 8,
    zIndex: 1,
  },
});
