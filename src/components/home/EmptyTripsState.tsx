import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EmptyTripsStateProps } from "../../types/home.types";

export const EmptyTripsState: React.FC<EmptyTripsStateProps> = ({
  onRetry,
  theme,
}) => {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.button,
          {
            borderColor: theme.alternate,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Generate new adventures"
      >
        <Ionicons
          name="add-circle-outline"
          size={40}
          color={theme.alternate}
          style={styles.icon}
        />
        <Text
          style={[styles.text, { color: theme.alternate }]}
          accessibilityRole="text"
        >
          Generate New{"\n"}Adventures
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 300,
  },
  button: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 2,
    borderStyle: "dashed",
    padding: 20,
  },
  icon: {
    marginBottom: 15,
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
    marginTop: 10,
    lineHeight: 24,
  },
});

export default React.memo(EmptyTripsState);
