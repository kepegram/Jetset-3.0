import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Switch,
  Alert,
  Pressable,
  Linking,
} from "react-native";
import { useTheme } from "../../../context/themeContext";
import {
  getUserNotificationSettings,
  updateNotificationSettings,
  registerForPushNotificationsAsync,
  testNotification,
} from "../../../utils/notifications";

const NotificationSettings: React.FC = () => {
  const { currentTheme } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [tripUpdatesEnabled, setTripUpdatesEnabled] = useState(true);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    const settings = await getUserNotificationSettings();
    if (settings) {
      setPushEnabled(settings.pushEnabled);
      setTripUpdatesEnabled(settings.tripUpdatesEnabled);
    }
  };

  const handlePushToggle = async (value: boolean) => {
    if (value) {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive push notifications.",
          [
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
            { text: "Cancel" },
          ]
        );
        return;
      }
    }
    setPushEnabled(value);
    await updateNotificationSettings({
      pushEnabled: value,
      tripUpdatesEnabled,
    });
  };

  const handleTripUpdatesToggle = async (value: boolean) => {
    setTripUpdatesEnabled(value);
    await updateNotificationSettings({
      pushEnabled,
      tripUpdatesEnabled: value,
    });
  };

  const handleTestNotification = async () => {
    try {
      await testNotification();
    } catch (error) {
      Alert.alert(
        "Notification Error",
        "Failed to send test notification. Please check your notification permissions in device settings.",
        [
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
          { text: "OK" },
        ]
      );
    }
  };

  const NotificationOption = ({
    title,
    description,
    value,
    onValueChange,
    disabled = false,
  }: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View style={styles.optionContainer}>
      <View style={styles.optionTextContainer}>
        <Text
          style={[
            styles.optionTitle,
            {
              color: disabled
                ? currentTheme.textSecondary
                : currentTheme.textPrimary,
            },
          ]}
        >
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
        disabled={disabled}
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
          onValueChange={handlePushToggle}
        />

        <NotificationOption
          title="Trip Updates"
          description="Get notified about changes to your trips and upcoming trip reminders"
          value={tripUpdatesEnabled}
          onValueChange={handleTripUpdatesToggle}
          disabled={!pushEnabled}
        />

        {pushEnabled && (
          <Pressable
            style={({ pressed }) => [
              styles.testButton,
              { backgroundColor: currentTheme.alternate },
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleTestNotification}
          >
            <Text style={styles.testButtonText}>Test Notification</Text>
          </Pressable>
        )}
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
  testButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  testButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "outfit-medium",
  },
});

export default NotificationSettings;
