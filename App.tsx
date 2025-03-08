import "react-native-get-random-values";
import React, { useEffect, useState, useCallback, useRef } from "react";

// Environment variables
const IOS_CLIENT_ID =
  "592334619232-6mcjbp53tn18uv7p8tna5frfg2mhg2c7.apps.googleusercontent.com";

import { Pressable, Platform, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { FIREBASE_AUTH } from "./firebase.config";
import { useColorScheme } from "react-native";
import { ThemeProvider, useTheme } from "./src/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as Notifications from "expo-notifications";
import Welcome from "./src/screens/onboarding/welcome/welcome";
import Login from "./src/screens/onboarding/userAuth/login";
import SignUp from "./src/screens/onboarding/userAuth/signup";
import ForgotPassword from "./src/screens/onboarding/userAuth/forgotPassword";
import AppNav from "./src/navigation/appNav";
import Terms from "./src/screens/onboarding/terms/terms";
import Privacy from "./src/screens/onboarding/privacy/privacy";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FIREBASE_DB } from "./firebase.config";
import * as Font from "expo-font";
import { registerForPushNotificationsAsync } from "./src/utils/notifications";

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  AppNav: undefined;
  Terms: undefined;
  Privacy: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

// Configure splash screen to stay visible
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

WebBrowser.maybeCompleteAuthSession();

const StatusBarWrapper = () => {
  const { theme } = useTheme();
  return <StatusBar style={theme === "dark" ? "light" : "dark"} />;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);
  const { currentTheme } = useTheme();
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    responseType: "id_token",
    scopes: ["profile", "email"],
  });

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const navigationRef = useRef<any>();

  const colorScheme = useColorScheme();

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      console.log("Google auth response success:", { hasToken: !!id_token });
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(FIREBASE_AUTH, credential)
          .then(async (userCredential) => {
            console.log("Firebase auth success:", userCredential.user.email);
            const user = userCredential.user;
            const userRef = doc(FIREBASE_DB, "users", user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
              console.log("Creating new user document");
              await setDoc(userRef, {
                username: user.displayName || "User",
                email: user.email,
                createdAt: new Date().toISOString(),
                authProvider: "google",
                photoURL: user.photoURL || null,
              });
            }
          })
          .catch((error) => {
            console.error("Firebase auth error:", {
              code: error.code,
              message: error.message,
            });
          });
      } else {
        console.error("No id_token in response params:", response.params);
      }
    } else if (response?.type === "error") {
      console.error("Google auth error:", response.error);
    }
  }, [response]);

  useEffect(() => {
    // Set up notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
        const data = response.notification.request.content.data;

        // Handle notification tap
        if (data.tripId) {
          navigationRef.current?.navigate("TripDetails", {
            trip: data.tripId,
            photoRef: data.photoRef || "",
            docId: data.tripId,
          });
        }
      });

    // Request permissions on app start
    registerForPushNotificationsAsync().catch((error) => {
      console.log("Failed to get push token:", error);
    });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts first
        await Font.loadAsync({
          ...Ionicons.font,
          // Add any other custom fonts here
        });

        // Wait for Firebase auth state
        const authPromise = new Promise((resolve) => {
          // Keep the auth subscription active
          onAuthStateChanged(
            FIREBASE_AUTH,
            async (user) => {
              console.log(
                "Auth state changed:",
                user ? `User logged in: ${user.email}` : "No user"
              );

              if (user) {
                // Check if user exists in Firestore
                const userRef = doc(FIREBASE_DB, "users", user.uid);
                const userDoc = await getDoc(userRef);

                if (!userDoc.exists()) {
                  // Create user document if it doesn't exist
                  console.log("Creating new user document for:", user.email);
                  await setDoc(userRef, {
                    username:
                      user.displayName || user.email?.split("@")[0] || "User",
                    email: user.email,
                    createdAt: new Date().toISOString(),
                    emailVerified: true, // Set to true for existing auth users
                    lastLoginAt: new Date().toISOString(),
                  });
                }

                // Set user regardless of verification status
                setUser(user);
              } else {
                setUser(null);
              }
              resolve(true);
            },
            (error) => {
              console.error("Auth state error:", error);
              resolve(true);
            }
          );
        });

        // Add a minimum delay to prevent flash
        const minimumDelay = new Promise((resolve) =>
          setTimeout(resolve, Platform.OS === "ios" ? 2000 : 2500)
        );

        // Wait for all initialization tasks
        await Promise.all([
          authPromise,
          minimumDelay,
          // Add other critical initialization promises here
        ]);
      } catch (e) {
        console.warn("Prepare error:", e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        // Add a longer delay to ensure everything is truly ready
        await new Promise((resolve) => setTimeout(resolve, 500));
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn("Error hiding splash screen:", e);
      }
    }
  }, [appIsReady]);

  const screenOptions = ({ navigation }: any) => ({
    headerStyle: {
      backgroundColor: currentTheme.background,
      borderBottomWidth: 0,
      shadowColor: "transparent",
      elevation: 0,
    },
    headerLeft: () => (
      <Pressable onPress={() => navigation.goBack()}>
        <Ionicons
          name="arrow-back"
          size={28}
          color={currentTheme.textPrimary}
          style={{ marginLeft: 15 }}
        />
      </Pressable>
    ),
    headerTitle: "",
  });

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ThemeProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBarWrapper />
          <Stack.Navigator initialRouteName="Welcome">
            {user ? (
              <Stack.Screen
                name="AppNav"
                component={AppNav}
                options={{ headerShown: false }}
              />
            ) : (
              <>
                <Stack.Screen
                  name="Welcome"
                  component={Welcome}
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="Login" options={{ headerShown: false }}>
                  {(props) => <Login {...props} promptAsync={promptAsync} />}
                </Stack.Screen>
                <Stack.Screen name="SignUp" options={{ headerShown: false }}>
                  {(props) => <SignUp {...props} promptAsync={promptAsync} />}
                </Stack.Screen>
                <Stack.Screen
                  name="ForgotPassword"
                  component={ForgotPassword}
                  options={screenOptions}
                />
                <Stack.Screen
                  name="Terms"
                  component={Terms}
                  options={{
                    title: "Terms & Conditions",
                    headerShown: true,
                  }}
                />
                <Stack.Screen
                  name="Privacy"
                  component={Privacy}
                  options={{
                    title: "Privacy Policy",
                    headerShown: true,
                  }}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </View>
  );
};

export default App;
