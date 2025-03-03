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
}

// Get user notification settings
export const getUserNotificationSettings =
  async (): Promise<NotificationSettings | null> => {
    const user = getAuth().currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(FIREBASE_DB, `users/${user.uid}`));
    if (!userDoc.exists()) return null;

    const data = userDoc.data();
    return {
      pushEnabled: data.notificationSettings?.pushEnabled ?? true,
      tripUpdatesEnabled: data.notificationSettings?.tripUpdatesEnabled ?? true,
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
