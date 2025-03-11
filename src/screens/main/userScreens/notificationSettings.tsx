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
  ScrollView,
} from "react-native";
import { useTheme } from "../../../context/themeContext";
import {
  getUserNotificationSettings,
  updateNotificationSettings,
  registerForPushNotificationsAsync,
  testNotification,
  testWeatherNotifications,
  DEFAULT_NOTIFICATION_SETTINGS,
} from "../../../utils/notifications";
import { Ionicons } from "@expo/vector-icons";

const NotificationSettings: React.FC = () => {
  const { currentTheme } = useTheme();
  const [settings, setSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    const userSettings = await getUserNotificationSettings();
    if (userSettings) {
      setSettings(userSettings);
    }
  };

  const handleSettingToggle = async (
    setting: keyof typeof settings,
    value: boolean
  ) => {
    if (setting === "pushEnabled" && value) {
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

    const newSettings = {
      ...settings,
      [setting]: value,
    };
    setSettings(newSettings);
    await updateNotificationSettings(newSettings);
  };

  const handlePreferenceToggle = async (
    preference: keyof typeof settings.preferences,
    value: any
  ) => {
    const newSettings = {
      ...settings,
      preferences: {
        ...settings.preferences,
        [preference]: value,
      },
    };
    setSettings(newSettings);
    await updateNotificationSettings(newSettings);
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

  const ExpandableSection = ({
    title,
    children,
    isExpanded,
    onToggle,
    disabled = false,
  }: {
    title: string;
    children: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    disabled?: boolean;
  }) => (
    <View style={[styles.expandableSection, { opacity: disabled ? 0.5 : 1 }]}>
      <Pressable
        onPress={onToggle}
        disabled={disabled}
        style={({ pressed }) => [
          styles.expandableHeader,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text
          style={[styles.expandableTitle, { color: currentTheme.textPrimary }]}
        >
          {title}
        </Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={24}
          color={currentTheme.textPrimary}
        />
      </Pressable>
      {isExpanded && <View style={styles.expandableContent}>{children}</View>}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <ScrollView style={styles.content}>
        <NotificationOption
          title="Push Notifications"
          description="Receive notifications on your device"
          value={settings.pushEnabled}
          onValueChange={(value) => handleSettingToggle("pushEnabled", value)}
        />

        <NotificationOption
          title="Trip Updates"
          description="Get notified about changes to your trips"
          value={settings.tripUpdatesEnabled}
          onValueChange={(value) =>
            handleSettingToggle("tripUpdatesEnabled", value)
          }
          disabled={!settings.pushEnabled}
        />

        <NotificationOption
          title="Trip Countdown"
          description="Receive reminders as your trip approaches"
          value={settings.countdownEnabled}
          onValueChange={(value) =>
            handleSettingToggle("countdownEnabled", value)
          }
          disabled={!settings.pushEnabled}
        />

        <NotificationOption
          title="Weather Alerts"
          description="Get weather updates and warnings for your destinations"
          value={settings.weatherAlertsEnabled}
          onValueChange={(value) =>
            handleSettingToggle("weatherAlertsEnabled", value)
          }
          disabled={!settings.pushEnabled}
        />

        <NotificationOption
          title="Flight Reminders"
          description="Receive check-in reminders and flight updates"
          value={settings.flightRemindersEnabled}
          onValueChange={(value) =>
            handleSettingToggle("flightRemindersEnabled", value)
          }
          disabled={!settings.pushEnabled}
        />

        <ExpandableSection
          title="Advanced Settings"
          isExpanded={expanded === "advanced"}
          onToggle={() =>
            setExpanded(expanded === "advanced" ? null : "advanced")
          }
          disabled={!settings.pushEnabled}
        >
          <View style={styles.advancedSettings}>
            <Text
              style={[
                styles.advancedTitle,
                { color: currentTheme.textPrimary },
              ]}
            >
              Weather Alert Types
            </Text>
            {["severe", "warning", "update"].map((type) => (
              <NotificationOption
                key={type}
                title={type.charAt(0).toUpperCase() + type.slice(1)}
                description={`Receive ${type} weather alerts`}
                value={settings.preferences.weatherAlertTypes.includes(
                  type as any
                )}
                onValueChange={(value) => {
                  const types = value
                    ? [...settings.preferences.weatherAlertTypes, type]
                    : settings.preferences.weatherAlertTypes.filter(
                        (t) => t !== type
                      );
                  handlePreferenceToggle("weatherAlertTypes", types);
                }}
                disabled={!settings.weatherAlertsEnabled}
              />
            ))}

            <Text
              style={[
                styles.advancedTitle,
                { color: currentTheme.textPrimary },
              ]}
            >
              Activity Notifications
            </Text>
            <NotificationOption
              title="Activity Reminders"
              description="Get reminded before scheduled activities"
              value={settings.preferences.notifyBeforeActivities}
              onValueChange={(value) =>
                handlePreferenceToggle("notifyBeforeActivities", value)
              }
              disabled={!settings.pushEnabled}
            />
          </View>
        </ExpandableSection>

        {settings.pushEnabled && (
          <View style={styles.testButtonsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.testButton,
                { backgroundColor: currentTheme.alternate },
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => testNotification()}
            >
              <Text style={styles.testButtonText}>Test Notification</Text>
            </Pressable>

            {settings.weatherAlertsEnabled && (
              <Pressable
                style={({ pressed }) => [
                  styles.testButton,
                  { backgroundColor: currentTheme.alternate },
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => {
                  testWeatherNotifications();
                }}
              >
                <Text style={styles.testButtonText}>Test Weather Alerts</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
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
  },
  optionDescription: {
    fontSize: 14,
  },
  expandableSection: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)",
  },
  expandableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  expandableTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  expandableContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.2)",
  },
  advancedSettings: {
    gap: 16,
  },
  advancedTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  testButtonsContainer: {
    marginTop: 24,
    gap: 12,
  },
  testButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  testButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default NotificationSettings;
