import React, { useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, Switch } from "react-native";
import { useTheme } from "../../../context/themeContext";

const NotificationSettings: React.FC = () => {
  const { currentTheme } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [tripUpdatesEnabled, setTripUpdatesEnabled] = useState(true);
  const [promotionalEnabled, setPromotionalEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const NotificationOption = ({
    title,
    description,
    value,
    onValueChange,
  }: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.optionContainer}>
      <View style={styles.optionTextContainer}>
        <Text style={[styles.optionTitle, { color: currentTheme.textPrimary }]}>
          {title}
        </Text>
        <Text
          style={[
            styles.optionDescription,
            { color: currentTheme.textSecondary },
          ]}
        >
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#767577", true: currentTheme.alternate }}
        thumbColor={"#f4f3f4"}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.content}>
        <Text
          style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}
        >
          Notification Preferences
        </Text>

        <NotificationOption
          title="Push Notifications"
          description="Receive notifications on your device"
          value={pushEnabled}
          onValueChange={setPushEnabled}
        />

        <NotificationOption
          title="Trip Updates"
          description="Get notified about changes to your trips"
          value={tripUpdatesEnabled}
          onValueChange={setTripUpdatesEnabled}
        />

        <NotificationOption
          title="Promotional Notifications"
          description="Receive deals and special offers"
          value={promotionalEnabled}
          onValueChange={setPromotionalEnabled}
        />

        <NotificationOption
          title="Email Notifications"
          description="Receive updates via email"
          value={emailEnabled}
          onValueChange={setEmailEnabled}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 24,
    fontFamily: "outfit-bold",
  },
  optionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    fontFamily: "outfit-medium",
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: "outfit-regular",
  },
});

export default NotificationSettings;
