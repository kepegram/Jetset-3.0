import React, { useContext, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  Text,
  View,
  Platform,
  ViewStyle,
} from "react-native";
import { useTheme } from "../context/themeContext";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { ProfileProvider, useProfile } from "../context/profileContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
// Legacy contexts removed - using scrapbook context instead

// Import scrapbook screens
import HomeGrid from "../screens/scrapbook/HomeGrid";
import AddTrip from "../screens/scrapbook/AddTrip";
import TripDetail from "../screens/scrapbook/TripDetail";
import AddExcursion from "../screens/scrapbook/AddExcursion";

// Import profile screens
import Profile from "../screens/main/userScreens/profile";
import Edit from "../screens/main/userScreens/settings";
import ChangeUsername from "../screens/main/userScreens/changeUsername";
import ChangePassword from "../screens/main/userScreens/changePassword";
import DeleteAccount from "../screens/main/userScreens/deleteAccount";

// Legacy trip screens removed - using scrapbook instead

export type RootStackParamList = {
  Welcome: undefined;
  Carousel: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  AppNav: undefined;
  App: undefined;
  HomeMain: undefined;
  Profile: undefined;
  Edit: undefined;
  ChangeUsername: undefined;
  ChangePassword: undefined;
  AppTheme: undefined;
  DeleteAccount: undefined;
  Map: undefined;
  AllTripsView: {
    trips: string;
    type: "current" | "upcoming" | "past";
  };
  // New scrapbook screens
  TripDetail: { tripId: string };
  AddTrip: undefined;
  AddExcursion: { tripId: string };
};

const ScrapbookStack: React.FC = () => {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="HomeMain"
        component={HomeGrid}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="TripDetail"
        component={TripDetail}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="AddTrip"
        component={AddTrip}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="AddExcursion"
        component={AddExcursion}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
};

// MyTripsStack removed - using scrapbook instead

interface ProfileStackProps {
  setBypassAuth?: (value: boolean) => void;
}

const ProfileStack: React.FC<ProfileStackProps> = ({ setBypassAuth }) => {
  const { currentTheme } = useTheme();

  const screenOptions = ({
    navigation,
  }: {
    navigation: any;
  }): NativeStackNavigationOptions => ({
    headerStyle: {
      backgroundColor: currentTheme.background,
    },
    headerShadowVisible: false,
    headerLeft: () => (
      <Pressable onPress={() => navigation.goBack()}>
        <Ionicons
          name="chevron-back"
          size={28}
          color={currentTheme.textPrimary}
          style={{ marginLeft: 10 }}
        />
      </Pressable>
    ),
    headerTitleStyle: {
      color: currentTheme.textPrimary,
      fontSize: 18,
      fontWeight: "bold",
    },
  });

  const profileScreenOptions = ({
    navigation,
  }: {
    navigation: any;
  }): NativeStackNavigationOptions => ({
    title: "Your Profile",
    ...screenOptions({ navigation }),
    headerLeft: () => null,
    headerBackVisible: false,
  });

  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="Profile"
        options={({ navigation }) => ({
          ...profileScreenOptions({ navigation }),
          title: "",
          headerShown: false,
        })}
      >
        {(props) => <Profile {...props} setBypassAuth={setBypassAuth} />}
      </RootStack.Screen>
      <RootStack.Screen
        name="Edit"
        component={Edit}
        options={({ navigation }) => ({
          ...screenOptions({ navigation }),
          title: "",
        })}
      />
      <RootStack.Screen
        name="ChangeUsername"
        component={ChangeUsername}
        options={({ navigation }) => ({
          ...screenOptions({ navigation }),
          title: "Change Username",
        })}
      />
      <RootStack.Screen
        name="ChangePassword"
        component={ChangePassword}
        options={({ navigation }) => ({
          ...screenOptions({ navigation }),
          title: "Change Password",
        })}
      />
      <RootStack.Screen
        name="DeleteAccount"
        component={DeleteAccount}
        options={({ navigation }) => ({
          ...screenOptions({ navigation }),
          title: "Delete Account",
        })}
      />
    </RootStack.Navigator>
  );
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const HIDDEN_TAB_SCREENS: string[] = [];

const getTabBarStyle = (route: any): ViewStyle | undefined => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? "Home";
  return HIDDEN_TAB_SCREENS.includes(routeName)
    ? { display: "none" as const }
    : undefined;
};

interface TabNavigatorProps {
  setBypassAuth?: (value: boolean) => void;
}

const TabNavigator: React.FC<TabNavigatorProps> = ({ setBypassAuth }) => {
  const { currentTheme } = useTheme();
  const { profilePicture } = useProfile();

  const tabBarDefaultStyle: ViewStyle = {
    height: Platform.OS === "ios" ? 85 : 65,
    paddingBottom: Platform.OS === "ios" ? 25 : 10,
    paddingTop: 10,
    borderTopWidth: 0,
  };

  const TabIcon = ({
    focused,
    color,
    icon,
    size = 32,
    isMaterial = false,
  }: {
    focused: boolean;
    color: string;
    icon: keyof typeof Ionicons.glyphMap | string;
    size?: number;
    isMaterial?: boolean;
  }) => {
    return (
      <View
        style={{
          padding: 8,
          borderRadius: 12,
          backgroundColor: focused
            ? currentTheme.alternateLight20
            : "transparent",
        }}
      >
        {isMaterial ? (
          <MaterialIcons name={icon as any} color={color} size={size} />
        ) : (
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            color={color}
            size={size}
          />
        )}
      </View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: currentTheme.alternate,
        tabBarInactiveTintColor: currentTheme.inactiveTabIcon,
      }}
    >
      <Tab.Screen
        name="Home"
        component={ScrapbookStack}
        options={({ route }) => ({
          tabBarStyle: {
            ...tabBarDefaultStyle,
            backgroundColor: currentTheme.background,
            ...getTabBarStyle(route),
          } as ViewStyle,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              icon="home-filled"
              size={34}
              isMaterial={true}
            />
          ),
        })}
      />
      {/* MyTrips tab removed - using scrapbook instead */}
      <Tab.Screen
        name="ProfileStack"
        options={({ route }) => ({
          tabBarStyle: {
            ...tabBarDefaultStyle,
            backgroundColor: currentTheme.background,
            ...getTabBarStyle(route),
          } as ViewStyle,
          tabBarIcon: ({ focused, color }) => (
            <View
              style={{
                padding: 4,
                borderRadius: 24,
                backgroundColor: focused
                  ? currentTheme.alternateLight20
                  : "transparent",
              }}
            >
              {profilePicture ? (
                <Image
                  source={{ uri: profilePicture }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderColor: focused
                      ? currentTheme.alternate
                      : "transparent",
                    borderWidth: 2,
                  }}
                />
              ) : (
                <Ionicons name="person-circle" size={38} color={color} />
              )}
            </View>
          ),
        })}
      >
        {(props) => <ProfileStack {...props} setBypassAuth={setBypassAuth} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

interface AppNavProps {
  setBypassAuth?: (value: boolean) => void;
}

const AppNav: React.FC<AppNavProps> = ({ setBypassAuth }) => {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <ProfileProvider>
        <RootStack.Navigator initialRouteName="App">
          <RootStack.Screen name="App" options={{ headerShown: false }}>
            {(props) => (
              <TabNavigator {...props} setBypassAuth={setBypassAuth} />
            )}
          </RootStack.Screen>
        </RootStack.Navigator>
      </ProfileProvider>
    </>
  );
};

export default AppNav;
