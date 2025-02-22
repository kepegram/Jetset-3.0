import "react-native-get-random-values";
import React, { useEffect, useState, useCallback } from "react";
import { Pressable, Animated, Dimensions, Platform, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { FIREBASE_AUTH } from "./firebase.config";
import { useColorScheme } from "react-native";
import { ThemeProvider, useTheme } from "./src/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Welcome from "./src/screens/onboarding/welcome/welcome";
import Login from "./src/screens/onboarding/userAuth/login";
import SignUp from "./src/screens/onboarding/userAuth/signup";
import ForgotPassword from "./src/screens/onboarding/userAuth/forgotPassword";
import AppNav from "./src/navigation/appNav";
import { Asset } from "expo-asset";
import Terms from './src/screens/onboarding/terms/Terms';
import Privacy from './src/screens/onboarding/privacy/Privacy';

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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

WebBrowser.maybeCompleteAuthSession();

const { width: screenWidth } = Dimensions.get("window");

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);
  const fadeAnim = new Animated.Value(1);
  const planeAnim = new Animated.Value(0);
  const textAnim = new Animated.Value(0);
  const { currentTheme } = useTheme();
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
  });

  const colorScheme = useColorScheme();
  const [isSplashReady, setIsSplashReady] = useState(false);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params as { id_token: string };
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(FIREBASE_AUTH, credential)
          .then((userCredential) => {
            const user = userCredential.user;
          })
          .catch((error) => {
            console.error("Error signing in with Google: ", error);
          });
      } else {
        console.error("No ID token found");
      }
    }
  }, [response]);

  useEffect(() => {
    const unsub = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsub();
  }, []);

  // Preload splash screen resources
  useEffect(() => {
    async function loadSplashResources() {
      try {
        // Preload the splash image
        const splashImage = require("./src/assets/splash/splash-icon-light.png");
        await Asset.fromModule(splashImage).downloadAsync();
        setIsSplashReady(true);
      } catch (e) {
        console.warn("Error loading splash resources:", e);
      }
    }
    loadSplashResources();
  }, []);

  // Prepare app resources and loading
  useEffect(() => {
    async function prepare() {
      try {
        // Wait for splash resources to load first
        await new Promise((resolve) => {
          if (isSplashReady) resolve(true);
        });

        // Pre-load fonts, make API calls, etc.
        await new Promise((resolve) =>
          setTimeout(resolve, Platform.OS === "ios" ? 1000 : 2000)
        );

        // Load any resources or data here
        await Promise.all([
          new Promise((resolve) =>
            onAuthStateChanged(FIREBASE_AUTH, (user) => {
              setUser(user);
              resolve(true);
            })
          ),
          // Add other initialization promises...
        ]);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, [isSplashReady]);

  // Handle splash screen animation
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        // Animate the plane and text
        Animated.sequence([
          Animated.parallel([
            Animated.timing(textAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(planeAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(async () => {
          try {
            await SplashScreen.hideAsync();
            setSplashAnimationComplete(true);
          } catch (e) {
            console.warn("Error hiding splash screen:", e);
          }
        });
      } catch (e) {
        console.warn("Error during splash animation:", e);
        // Fallback in case of animation failure
        await SplashScreen.hideAsync();
        setSplashAnimationComplete(true);
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

  if (!appIsReady || !isSplashReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <NavigationContainer onReady={onLayoutRootView}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        {!splashAnimationComplete && (
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#3BACE3",
              opacity: fadeAnim,
              zIndex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Animated.Image
              source={require("./src/assets/splash/splash-icon-light.png")}
              style={{
                opacity: textAnim,
                width: screenWidth * 2.0,
                height: screenWidth * 0.533,
                transform: [
                  {
                    translateY: planeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              }}
              resizeMode="contain"
            />
          </Animated.View>
        )}
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
                  title: 'Terms & Conditions',
                  headerShown: true,
                }}
              />
              <Stack.Screen 
                name="Privacy" 
                component={Privacy}
                options={{
                  title: 'Privacy Policy',
                  headerShown: true,
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;
