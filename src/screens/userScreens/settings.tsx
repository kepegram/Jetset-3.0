import React, { useState, useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Switch,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/appNav";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FIREBASE_DB } from "../../../../firebase.config";
import { useTheme } from "../../../context/themeContext";

// Navigation prop type for the Edit screen
type EditScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Edit"
>;

const Edit: React.FC = () => {
  const { currentTheme, theme, setTheme } = useTheme();
  const navigation = useNavigation<EditScreenNavigationProp>();
  const [userName, setUserName] = useState<string | null>("");
  const [isThirdPartyAuth, setIsThirdPartyAuth] = useState(false);

  // Replace the useEffect with useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const user = getAuth().currentUser;
        if (user) {
          try {
            // Check if user is authenticated with Google or Apple
            const isOAuthUser = user.providerData.some(
              (provider) =>
                provider.providerId === "google.com" ||
                provider.providerId === "apple.com"
            );
            setIsThirdPartyAuth(isOAuthUser);

            const userDoc = await getDoc(doc(FIREBASE_DB, "users", user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setUserName(data?.name || data?.username || "");
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        }
      };

      fetchUserData();
    }, [])
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      {/* Account Settings Section */}
      <View style={styles.formContainer}>
        <View style={styles.securitySection}>
          <Text
            style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}
          >
            Account Settings
          </Text>

          {/* Username Option */}
          <Pressable
            style={({ pressed }) => [
              styles.securityOption,
              {
                backgroundColor: pressed
                  ? currentTheme.inactive + "20"
                  : "transparent",
              },
            ]}
            onPress={() => navigation.navigate("ChangeUsername")}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name="person-outline"
                size={24}
                color={currentTheme.icon}
              />
              <View style={styles.optionTextContainer}>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: currentTheme.textPrimary },
                  ]}
                >
                  Username
                </Text>
                <Text
                  style={[
                    styles.optionValue,
                    { color: currentTheme.textSecondary },
                  ]}
                >
                  {userName || "Not set"}
                </Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={currentTheme.icon}
            />
          </Pressable>

          {/* Password Option - only show for email/password users */}
          {!isThirdPartyAuth && (
            <Pressable
              style={({ pressed }) => [
                styles.securityOption,
                {
                  backgroundColor: pressed
                    ? currentTheme.inactive + "20"
                    : "transparent",
                },
              ]}
              onPress={() => navigation.navigate("ChangePassword")}
            >
              <View style={styles.optionContent}>
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color={currentTheme.icon}
                />
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: currentTheme.textPrimary },
                    ]}
                  >
                    Password
                  </Text>
                  <Text
                    style={[
                      styles.optionValue,
                      { color: currentTheme.textSecondary },
                    ]}
                  >
                    ******
                  </Text>
                </View>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={currentTheme.icon}
              />
            </Pressable>
          )}

          {/* Dark Mode Toggle */}
          <View
            style={[
              styles.securityOption,
              {
                backgroundColor: "transparent",
              },
            ]}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name={theme === "dark" ? "moon-outline" : "sunny-outline"}
                size={24}
                color={currentTheme.icon}
              />
              <View style={styles.optionTextContainer}>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: currentTheme.textPrimary },
                  ]}
                >
                  Dark Mode
                </Text>
              </View>
            </View>
            <Switch
              value={theme === "dark"}
              onValueChange={(value) => setTheme(value ? "dark" : "light")}
              trackColor={{ false: "#767577", true: currentTheme.alternate }}
              thumbColor={"#f4f3f4"}
            />
          </View>
        </View>

        {/* Delete Account Button */}
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => navigation.navigate("DeleteAccount")}
        >
          <Text
            style={[styles.deleteButtonText, { color: currentTheme.error }]}
          >
            Delete Account
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default Edit;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: 24,
  },
  securitySection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 24,
  },
  securityOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionTextContainer: {
    marginLeft: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionValue: {
    fontSize: 14,
    marginTop: 2,
  },
  deleteButton: {
    width: "100%",
    alignItems: "center",
    marginTop: "auto",
    padding: 16,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
