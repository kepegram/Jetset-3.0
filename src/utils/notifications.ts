import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getAuth } from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebase.config";

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions
export const registerForPushNotificationsAsync = async () => {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    // Get the token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "cf7b3e9e-07c0-457e-b3b0-d4179b54b637", // Your Expo project ID from app.json
    });

    // Save the token to Firestore
    const user = getAuth().currentUser;
    if (user) {
      const userRef = doc(FIREBASE_DB, "users", user.uid);
      await setDoc(userRef, { expoPushToken: token.data }, { merge: true });
    }

    // Configure for Android
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3BACE3",
      });
    }

    return token.data;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
};

// Schedule a trip reminder
export const scheduleTripReminder = async (
  tripId: string,
  tripName: string,
  startDate: Date
) => {
  const reminderDate = new Date(startDate);
  reminderDate.setDate(reminderDate.getDate() - 1); // 24 hours before

  if (reminderDate > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Trip Starting Tomorrow! 🌍",
        body: `Get ready for your trip to ${tripName}! Don't forget to check your itinerary.`,
        data: { tripId },
      },
      trigger: {
        channelId: "default",
        date: reminderDate,
      },
    });
  }
};

// Save notification to Firestore
const saveNotificationToFirestore = async (
  title: string,
  message: string,
  data?: any
) => {
  const user = getAuth().currentUser;
  if (!user) return;

  const notificationsRef = collection(
    FIREBASE_DB,
    `users/${user.uid}/notifications`
  );
  await addDoc(notificationsRef, {
    title,
    message,
    timestamp: Timestamp.now(),
    read: false,
    data,
  });
};

// Test notification function
export const testNotification = async () => {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Permission not granted");
      }
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification 🔔",
        body: "This is a test notification from Jetset!",
        data: { screen: "HomeMain" },
        sound: true,
        badge: 1,
      },
      trigger: null,
    });

    // Save to Firestore
    await saveNotificationToFirestore(
      "Test Notification 🔔",
      "This is a test notification from Jetset!",
      { screen: "HomeMain" }
    );

    console.log("Notification scheduled:", notificationId);
    return notificationId;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

// Send new recommended trips notification
export const sendRecommendedTripsNotification = async () => {
  const title = "New Trip Recommendations! ✈️";
  const message =
    "We've curated some exciting new trips just for you. Check them out!";

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: message,
    },
    trigger: null,
  });

  await saveNotificationToFirestore(title, message);
};

// Send trip update notification
export const sendTripUpdateNotification = async (
  tripName: string,
  updateType: string
) => {
  const title = "Trip Update 🔄";
  const message = `${updateType} for your trip to ${tripName}`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: message,
    },
    trigger: null,
  });

  await saveNotificationToFirestore(title, message, { tripName });
};

// Send travel alert
export const sendTravelAlert = async (
  tripId: string,
  tripName: string,
  alertMessage: string
) => {
  const title = "Travel Alert! ⚠️";
  const message = `${alertMessage} for your trip to ${tripName}`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: message,
      data: { tripId },
    },
    trigger: null,
  });

  await saveNotificationToFirestore(title, message, { tripId, tripName });
};

// Send account security notification
export const sendSecurityNotification = async (action: string) => {
  const title = "Security Alert 🔒";
  const message = `Your account ${action}. If this wasn't you, please contact support.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: message,
    },
    trigger: null,
  });

  await saveNotificationToFirestore(title, message);
};

// Types
interface NotificationSettings {
  pushEnabled: boolean;
  tripUpdatesEnabled: boolean;
  countdownEnabled: boolean;
  weatherAlertsEnabled: boolean;
  flightRemindersEnabled: boolean;
  // Notification preferences
  preferences: {
    countdownDays: number[]; // Array of days before trip to notify [7, 3, 1, 0]
    weatherAlertTypes: ("severe" | "warning" | "update")[]; // Types of weather alerts to receive
    notifyBeforeActivities: boolean; // Whether to notify before scheduled activities
  };
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  tripUpdatesEnabled: true,
  countdownEnabled: true,
  weatherAlertsEnabled: true,
  flightRemindersEnabled: true,
  preferences: {
    countdownDays: [7, 3, 1, 0],
    weatherAlertTypes: ["severe", "warning", "update"],
    notifyBeforeActivities: true,
  },
};

// Get user notification settings
export const getUserNotificationSettings =
  async (): Promise<NotificationSettings | null> => {
    const user = getAuth().currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(FIREBASE_DB, `users/${user.uid}`));
    if (!userDoc.exists()) return null;

    const data = userDoc.data();
    return {
      pushEnabled:
        data.notificationSettings?.pushEnabled ??
        DEFAULT_NOTIFICATION_SETTINGS.pushEnabled,
      tripUpdatesEnabled:
        data.notificationSettings?.tripUpdatesEnabled ??
        DEFAULT_NOTIFICATION_SETTINGS.tripUpdatesEnabled,
      countdownEnabled:
        data.notificationSettings?.countdownEnabled ??
        DEFAULT_NOTIFICATION_SETTINGS.countdownEnabled,
      weatherAlertsEnabled:
        data.notificationSettings?.weatherAlertsEnabled ??
        DEFAULT_NOTIFICATION_SETTINGS.weatherAlertsEnabled,
      flightRemindersEnabled:
        data.notificationSettings?.flightRemindersEnabled ??
        DEFAULT_NOTIFICATION_SETTINGS.flightRemindersEnabled,
      preferences: {
        countdownDays:
          data.notificationSettings?.preferences?.countdownDays ??
          DEFAULT_NOTIFICATION_SETTINGS.preferences.countdownDays,
        weatherAlertTypes:
          data.notificationSettings?.preferences?.weatherAlertTypes ??
          DEFAULT_NOTIFICATION_SETTINGS.preferences.weatherAlertTypes,
        notifyBeforeActivities:
          data.notificationSettings?.preferences?.notifyBeforeActivities ??
          DEFAULT_NOTIFICATION_SETTINGS.preferences.notifyBeforeActivities,
      },
    };
  };

// Update user notification settings
export const updateNotificationSettings = async (
  settings: NotificationSettings
) => {
  const user = getAuth().currentUser;
  if (!user) return;

  await updateDoc(doc(FIREBASE_DB, `users/${user.uid}`), {
    notificationSettings: settings,
  });
};

// Schedule countdown notifications for a trip
export const scheduleTripCountdownNotifications = async (
  tripId: string,
  tripName: string,
  startDate: Date
) => {
  const notifications = [
    {
      days: 7,
      emoji: "🗓️",
      message: "Your trip to {tripName} is just a week away!",
    },
    {
      days: 3,
      emoji: "📅",
      message: "Only 3 days until your {tripName} adventure begins!",
    },
    {
      days: 1,
      emoji: "🎒",
      message: "Get ready! Your trip to {tripName} starts tomorrow!",
    },
    {
      days: 0,
      emoji: "✈️",
      message: "Today's the day! Your {tripName} journey begins!",
    },
  ];

  for (const notification of notifications) {
    const notificationDate = new Date(startDate);
    notificationDate.setDate(notificationDate.getDate() - notification.days);

    if (notificationDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${notification.emoji} Trip Countdown`,
          body: notification.message.replace("{tripName}", tripName),
          data: { tripId, type: "countdown" },
        },
        trigger: {
          channelId: "default",
          date: notificationDate,
        },
      });

      // Save to Firestore for tracking
      await saveNotificationToFirestore(
        `${notification.emoji} Trip Countdown`,
        notification.message.replace("{tripName}", tripName),
        { tripId, type: "countdown", daysRemaining: notification.days }
      );
    }
  }
};

// Schedule flight check-in reminder
export const scheduleFlightCheckInReminder = async (
  tripId: string,
  tripName: string,
  flightDate: Date
) => {
  const checkInDate = new Date(flightDate);
  checkInDate.setDate(checkInDate.getDate() - 1);

  if (checkInDate > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "✈️ Flight Check-in Reminder",
        body: `Don't forget to check in for your flight to ${tripName}! Most airlines open check-in 24 hours before departure.`,
        data: { tripId, type: "flight-checkin" },
      },
      trigger: {
        channelId: "default",
        date: checkInDate,
      },
    });

    await saveNotificationToFirestore(
      "✈️ Flight Check-in Reminder",
      `Don't forget to check in for your flight to ${tripName}!`,
      { tripId, type: "flight-checkin" }
    );
  }
};

// Send weather alert for trip
export const sendWeatherAlert = async (
  tripId: string,
  tripName: string,
  alertType: "severe" | "warning" | "update",
  weatherDetails: string
) => {
  const alertEmojis = {
    severe: "⛈️",
    warning: "🌧️",
    update: "🌤️",
  };

  const alertTitles = {
    severe: "Severe Weather Alert",
    warning: "Weather Warning",
    update: "Weather Update",
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${alertEmojis[alertType]} ${alertTitles[alertType]}`,
      body: `${weatherDetails} for your trip to ${tripName}`,
      data: { tripId, type: "weather", alertType },
      sound: true,
      badge: 1,
    },
    trigger: null, // Send immediately
  });

  await saveNotificationToFirestore(
    `${alertEmojis[alertType]} ${alertTitles[alertType]}`,
    `${weatherDetails} for your trip to ${tripName}`,
    { tripId, type: "weather", alertType }
  );
};

// Weather API integration
// @ts-ignore
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
const WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1";
const WEATHER_CHECK_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// Cache for weather checks to prevent duplicate API calls
const weatherCheckCache = new Map<
  string,
  {
    timestamp: number;
    alerts: WeatherAlert[];
  }
>();

// Validate weather API key
const validateWeatherApiKey = () => {
  if (!WEATHER_API_KEY) {
    console.error(
      "Weather API key is not configured. Please add EXPO_PUBLIC_WEATHER_API_KEY to your .env file"
    );
    return false;
  }
  return true;
};

interface WeatherAlert {
  severity: "severe" | "warning" | "update";
  details: string;
  timestamp: number;
}

// Check if we need to make a new API call
const shouldCheckWeather = (location: string): boolean => {
  const cached = weatherCheckCache.get(location);
  if (!cached) return true;

  const now = Date.now();
  return now - cached.timestamp >= WEATHER_CHECK_INTERVAL;
};

// Check weather for a trip
export const checkWeatherForTrip = async (
  tripId: string,
  tripName: string,
  location: string,
  startDate: Date,
  endDate: Date
) => {
  try {
    const settings = await getUserNotificationSettings();
    if (!settings?.weatherAlertsEnabled) return;

    if (!validateWeatherApiKey()) return;

    // Check cache first
    if (!shouldCheckWeather(location)) {
      const cached = weatherCheckCache.get(location);
      if (cached) {
        console.log("Using cached weather data for", location);
        return cached.alerts;
      }
    }

    console.log("Fetching fresh weather data for", location);
    const response = await fetch(
      `${WEATHER_API_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
        location
      )}&days=3&alerts=yes`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Weather API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return [];
    }

    const data = await response.json();
    const alerts: WeatherAlert[] = [];
    const now = Date.now();

    // Check for severe weather alerts
    if (data.alerts?.alert) {
      for (const alert of data.alerts.alert) {
        const severity =
          alert.severity === "Severe"
            ? "severe"
            : alert.severity === "Moderate"
            ? "warning"
            : "update";

        if (settings.preferences.weatherAlertTypes.includes(severity)) {
          alerts.push({
            severity,
            details: alert.desc,
            timestamp: now,
          });
        }
      }
    }

    // Update cache
    weatherCheckCache.set(location, {
      timestamp: now,
      alerts,
    });

    // Only send notifications for new alerts
    for (const alert of alerts) {
      await sendWeatherAlert(tripId, tripName, alert.severity, alert.details);
    }

    return alerts;
  } catch (error) {
    console.error("Error checking weather:", error);
    return [];
  }
};

// Schedule all trip-related notifications
export const scheduleAllTripNotifications = async (
  tripId: string,
  tripName: string,
  startDate: Date,
  location: string,
  hasFlights: boolean = true
) => {
  try {
    const settings = await getUserNotificationSettings();
    if (!settings || !settings.pushEnabled) return;

    // Schedule countdown notifications if enabled
    if (settings.countdownEnabled) {
      await scheduleTripCountdownNotifications(tripId, tripName, startDate);
    }

    // Schedule flight check-in reminder if enabled and trip includes flights
    if (settings.flightRemindersEnabled && hasFlights) {
      await scheduleFlightCheckInReminder(tripId, tripName, startDate);
    }

    // Initial weather check if enabled
    if (settings.weatherAlertsEnabled) {
      await checkWeatherForTrip(
        tripId,
        tripName,
        location,
        startDate,
        new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)
      );
    }

    console.log("Successfully scheduled all trip notifications");
  } catch (error) {
    console.error("Error scheduling trip notifications:", error);
    throw error;
  }
};

// Test weather notifications
export const testWeatherNotifications = async () => {
  try {
    // Test location with known weather conditions
    const testTrip = {
      id: "test-trip-" + Date.now(),
      name: "Test Trip to New York",
      location: "New York",
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    };

    console.log("Testing weather notifications for:", testTrip.location);

    // Send one test weather alert
    await sendWeatherAlert(
      testTrip.id,
      testTrip.name,
      "warning",
      "Test Weather Warning: This is a test weather alert for your upcoming trip."
    );
    console.log("Sent test weather alert");

    return {
      success: true,
      message:
        "Weather test notification sent. Check your device for the notification.",
    };
  } catch (error: any) {
    console.error("Error testing weather notifications:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
      message: "Weather notification test failed. Check console for details.",
    };
  }
};
