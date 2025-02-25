import { StyleSheet, View, Pressable, Text, Animated } from "react-native";
import React, { useRef, useEffect } from "react";
import { useTheme } from "../../../context/themeContext";
import { Ionicons } from "@expo/vector-icons";

const AppTheme: React.FC = () => {
  // Get theme context values
  const { theme, setTheme, currentTheme } = useTheme();
  const isDarkTheme = theme === "dark";

  // Animation values
  const lightScaleAnim = useRef(
    new Animated.Value(theme === "light" ? 1 : 0.95)
  ).current;
  const darkScaleAnim = useRef(
    new Animated.Value(theme === "dark" ? 1 : 0.95)
  ).current;

  // Run animation when theme changes
  useEffect(() => {
    Animated.parallel([
      Animated.spring(lightScaleAnim, {
        toValue: theme === "light" ? 1 : 0.95,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(darkScaleAnim, {
        toValue: theme === "dark" ? 1 : 0.95,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [theme]);

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.themeContainer}>
        <Text style={[styles.title, { color: currentTheme.textPrimary }]}>
          Choose Your Theme
        </Text>

        <View style={styles.optionsContainer}>
          <Animated.View style={{ transform: [{ scale: lightScaleAnim }] }}>
            <Pressable
              style={[
                styles.themeOption,
                !isDarkTheme && styles.activeThemeOption,
                {
                  borderColor: isDarkTheme
                    ? currentTheme.secondary
                    : currentTheme.alternate,
                  backgroundColor: !isDarkTheme
                    ? `${currentTheme.alternate}15`
                    : "transparent",
                },
              ]}
              onPress={() => setTheme("light")}
              android_ripple={{ color: `${currentTheme.alternate}30` }}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name="sunny"
                  size={32}
                  color={
                    isDarkTheme
                      ? currentTheme.secondary
                      : currentTheme.alternate
                  }
                />
              </View>
              <Text
                style={[styles.optionText, { color: currentTheme.textPrimary }]}
              >
                Light Mode
              </Text>
              <View
                style={[
                  styles.checkmark,
                  !isDarkTheme && [
                    styles.activeCheckmark,
                    {
                      backgroundColor: currentTheme.alternate,
                      borderColor: currentTheme.alternate,
                    },
                  ],
                ]}
              >
                {!isDarkTheme && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: darkScaleAnim }] }}>
            <Pressable
              style={[
                styles.themeOption,
                isDarkTheme && styles.activeThemeOption,
                {
                  borderColor: isDarkTheme
                    ? currentTheme.alternate
                    : currentTheme.secondary,
                  backgroundColor: isDarkTheme
                    ? `${currentTheme.alternate}15`
                    : "transparent",
                },
              ]}
              onPress={() => setTheme("dark")}
              android_ripple={{ color: `${currentTheme.alternate}30` }}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name="moon"
                  size={32}
                  color={
                    isDarkTheme
                      ? currentTheme.alternate
                      : currentTheme.secondary
                  }
                />
              </View>
              <Text
                style={[styles.optionText, { color: currentTheme.textPrimary }]}
              >
                Dark Mode
              </Text>
              <View
                style={[
                  styles.checkmark,
                  isDarkTheme && [
                    styles.activeCheckmark,
                    {
                      backgroundColor: currentTheme.alternate,
                      borderColor: currentTheme.alternate,
                    },
                  ],
                ]}
              >
                {isDarkTheme && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default AppTheme;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  themeContainer: {
    width: "90%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "outfit-bold",
    marginBottom: 36,
    textAlign: "center",
  },
  optionsContainer: {
    gap: 24,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  activeThemeOption: {
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  optionText: {
    fontSize: 18,
    fontFamily: "outfit-medium",
    marginLeft: 16,
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#555",
    alignItems: "center",
    justifyContent: "center",
  },
  activeCheckmark: {
    borderColor: "transparent",
  },
});
