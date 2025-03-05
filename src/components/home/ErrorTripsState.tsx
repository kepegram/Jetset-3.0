import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ErrorTripsStateProps } from "../../types/home.types";

export const ErrorTripsState: React.FC<ErrorTripsStateProps> = ({
  onRetry,
  theme,
  error,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={theme.error || "#F44336"}
          style={styles.icon}
        />
        <Text
          style={[styles.title, { color: theme.textPrimary }]}
          accessibilityRole="header"
        >
          Oops! Something Went Wrong
        </Text>
        <Text
          style={[styles.text, { color: theme.textSecondary }]}
          accessibilityRole="text"
        >
          {error || "We couldn't generate your trips. Please try again."}
        </Text>
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.error || "#F44336" },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <View style={styles.buttonContent}>
            <Ionicons
              name="refresh-outline"
              size={20}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Try Again</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    height: 300,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 200,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
});

export default React.memo(ErrorTripsState);
