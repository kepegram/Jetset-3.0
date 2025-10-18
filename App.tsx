import "react-native-get-random-values";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Pressable, Platform, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { User, onAuthStateChanged } from "firebase/auth";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/firebase.config";
import { ScrapbookProvider } from "@/src/context/scrapbookContext";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import Welcome from "@/src/screens/onboarding/welcome/welcome";
import Login from "@/src/screens/onboarding/userAuth/login";
import SignUp from "@/src/screens/onboarding/userAuth/signup";
import ForgotPassword from "@/src/screens/onboarding/userAuth/forgotPassword";
import AppNav from "@/src/navigation/appNav";
import Terms from "@/src/screens/onboarding/terms/terms";
import Privacy from "@/src/screens/onboarding/privacy/privacy";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as Font from "expo-font";

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

// Configure splash screen to stay visible
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

const StatusBarWrapper = () => {
  return <StatusBar style="dark" />;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false); // Testing bypass flag

  const navigationRef = useRef<any>();

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
        });

        const authPromise = new Promise((resolve) => {
          onAuthStateChanged(FIREBASE_AUTH, async (user) => {
            if (user) {
              const userRef = doc(FIREBASE_DB, "users", user.uid);
              const userDoc = await getDoc(userRef);

              if (!userDoc.exists()) {
                await setDoc(userRef, {
                  username: user.displayName || "User",
                  email: user.email,
                  createdAt: new Date().toISOString(),
                  authProvider: "google",
                  photoURL: user.photoURL || null,
                });
              }

              setUser(user);
            } else {
              setUser(null);
            }
            resolve(true);
          });
        });

        const minimumDelay = new Promise((resolve) =>
          setTimeout(resolve, Platform.OS === "ios" ? 2000 : 2500)
        );

        await Promise.all([authPromise, minimumDelay]);
      } catch (e) {
        // Silent error handling
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn("Error hiding splash screen:", e);
      }
    }
  }, [appIsReady]);

  const screenOptions = ({ navigation }: any) => ({
    headerStyle: {
      backgroundColor: "#F8F5F0",
      borderBottomWidth: 0,
      shadowColor: "transparent",
      elevation: 0,
    },
    headerLeft: () => (
      <Pressable onPress={() => navigation.goBack()}>
        <Ionicons
          name="arrow-back"
          size={28}
          color="#000000"
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
      <ScrapbookProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBarWrapper />
          <Stack.Navigator initialRouteName="Welcome">
            {user || bypassAuth ? (
              <Stack.Screen name="AppNav" options={{ headerShown: false }}>
                {(props) => <AppNav {...props} setBypassAuth={setBypassAuth} />}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen name="Welcome" options={{ headerShown: false }}>
                  {(props) => (
                    <Welcome {...props} setBypassAuth={setBypassAuth} />
                  )}
                </Stack.Screen>
                <Stack.Screen
                  name="Login"
                  component={Login}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="SignUp"
                  component={SignUp}
                  options={{ headerShown: false }}
                />
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
      </ScrapbookProvider>
    </View>
  );
};

export default App;
