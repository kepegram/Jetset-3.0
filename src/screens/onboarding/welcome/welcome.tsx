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
} from "react-native";
import { MainButton } from "../../../components/ui/button";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { lightTheme } from "../../../theme/theme";
import Terms from "../terms/terms";
import Privacy from "../privacy/privacy";
import Login from "../userAuth/login";
import SignUp from "../userAuth/signup";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider } from "firebase/auth";
import { signInWithCredential } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../../../firebase.config";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../App";

// Define the navigation prop type
type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

const Welcome: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [slideAnim] = useState(
    new RNAnimated.Value(Dimensions.get("window").height)
  );
  const [opacityAnim] = useState(new RNAnimated.Value(0));
  const [scaleAnim] = useState(new RNAnimated.Value(1));
  const [translateAnim] = useState(new RNAnimated.Value(0));

  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
  });

  const facts = [
    {
      title: "AI-Powered Travel Planning 🤖",
      description: "Personalized travel plans created just for you",
      image: require("../../../assets/popular-imgs/paris.jpg"),
      location: "Paris",
    },
    {
      title: "Interactive Trip Planning 🗺️",
      description: "Visualize your journey with interactive maps",
      image: require("../../../assets/popular-imgs/dubai.jpg"),
      location: "Dubai",
    },
    {
      title: "Smart Itineraries 📱",
      description: "Day-by-day plans with local insights",
      image: require("../../../assets/popular-imgs/tokyo.jpeg"),
      location: "Tokyo",
    },
    {
      title: "Always Available 🌐",
      description: "Access your trips even offline",
      image: require("../../../assets/popular-imgs/sydney.jpg"),
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
    if (response?.type === "success" && "params" in response) {
      const { id_token } = response.params as { id_token: string };

      if (id_token) {
        try {
          const credential = GoogleAuthProvider.credential(id_token);

          signInWithCredential(FIREBASE_AUTH, credential)
            .then((userCredential) => {
              const user = userCredential.user;

              // Create/update user document in Firestore
              const userRef = doc(FIREBASE_DB, "users", user.uid);
              getDoc(userRef)
                .then((docSnap) => {
                  if (!docSnap.exists()) {
                    return setDoc(userRef, {
                      username: user.displayName || "User",
                      email: user.email,
                      createdAt: new Date().toISOString(),
                      authProvider: "google",
                      photoURL: user.photoURL || null,
                      lastLoginAt: new Date().toISOString(),
                    });
                  } else {
                    return updateDoc(userRef, {
                      lastLoginAt: new Date().toISOString(),
                    });
                  }
                })
                .then(() => {
                  // First animate the modal closing
                  handleCloseAuthModal();
                  // Wait for animation to complete before navigating
                  setTimeout(() => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: "AppNav" as const }],
                    });
                  }, 400); // Slightly longer than the animation duration to ensure smooth transition
                })
                .catch(() => {
                  // Silent error handling
                });
            })
            .catch(() => {
              // Silent error handling
            });
        } catch (error) {
          // Silent error handling
        }
      }
    }
  }, [response, navigation]);

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

  const handleSwitchAuthMode = (mode: "login" | "signup") => {
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

  // Add cleanup effect for status bar
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
              <Animated.Text
                entering={FadeIn.delay(500).duration(1000)}
                style={styles.appName}
              >
                Jetset
              </Animated.Text>

              <Animated.Text
                entering={FadeIn.delay(1000).duration(1000)}
                style={styles.slogan}
              >
                Dream. Discover.{" "}
                <Text style={styles.exploreText}>Explore.</Text>
              </Animated.Text>
            </View>

            <View style={styles.bottomSection}>
              <Animated.View
                entering={FadeIn.delay(1500).duration(1000)}
                style={styles.buttonContainer}
              >
                <MainButton
                  onPress={handleAuthPress}
                  buttonText="Continue"
                  style={styles.continueButton}
                  textColor="white"
                />
              </Animated.View>

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

      {/* Terms and Privacy Modals */}
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

      {/* Auth Modal */}
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
              styles.authModalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.authModalHeader}>
              <Text style={styles.authModalTitle}>
                {authMode === "login" ? "Login" : "Sign Up"}
              </Text>
              <TouchableOpacity
                onPress={handleCloseAuthModal}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
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
              ) : (
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
              )}
            </View>
            <View style={styles.authModalBody}>
              {authMode === "login" ? (
                <Login
                  promptAsync={promptAsync}
                  onSwitchToSignUp={() => handleSwitchAuthMode("signup")}
                  onAuthSuccess={handleAuthSuccess}
                />
              ) : (
                <SignUp
                  promptAsync={promptAsync}
                  onSwitchToLogin={() => handleSwitchAuthMode("login")}
                  onAuthSuccess={handleAuthSuccess}
                />
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
    backgroundColor: "#000",
  },
  blackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
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
  factImage: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    marginBottom: 16,
    justifyContent: "flex-end",
  },
  factImageStyle: {
    borderRadius: 20,
  },
  factContent: {
    padding: 8,
  },
  factTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: lightTheme.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  factDescription: {
    fontSize: 16,
    color: lightTheme.textSecondary,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  continueButton: {
    backgroundColor: lightTheme.alternate,
    width: "80%",
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
    bottom: 16,
    left: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    color: lightTheme.textPrimary,
    fontSize: 14,
    fontWeight: "600",
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
    height: Dimensions.get("window").height * 0.94,
    backgroundColor: lightTheme.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  authModalContent: {
    height: Dimensions.get("window").height * 0.48,
  },
  authModalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    position: "relative",
  },
  authModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: lightTheme.textPrimary,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: lightTheme.textSecondary,
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
  },
});

// Export the modal styles so they can be reused
export const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  modalContent: {
    width: "100%",
    height: Dimensions.get("window").height * 0.94,
    backgroundColor: lightTheme.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
});
