import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useTheme } from "../../../context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../../../firebase.config";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const NotificationsScreen: React.FC = () => {
  const { currentTheme } = useTheme();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;

    const notificationsRef = collection(
      FIREBASE_DB,
      `users/${user.uid}/notifications`
    );
    const notificationsQuery = query(
      notificationsRef,
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationsData.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          timestamp: data.timestamp.toDate(),
          read: data.read,
        });
      });
      setNotifications(notificationsData);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    const user = getAuth().currentUser;
    if (!user) return;

    try {
      const notificationRef = doc(
        FIREBASE_DB,
        `users/${user.uid}/notifications/${id}`
      );
      await updateDoc(notificationRef, {
        read: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable
      style={[
        styles.notificationItem,
        { backgroundColor: currentTheme.shadowBackground },
        !item.read && styles.unreadNotification,
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text
            style={[
              styles.notificationTitle,
              { color: currentTheme.textPrimary },
            ]}
          >
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text
          style={[
            styles.notificationMessage,
            { color: currentTheme.textSecondary },
          ]}
        >
          {item.message}
        </Text>
        <Text
          style={[
            styles.notificationTime,
            { color: currentTheme.textSecondary },
          ]}
        >
          {item.timestamp.toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={currentTheme.textPrimary}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: currentTheme.textPrimary }]}>
          Notifications
        </Text>
      </View>
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color={currentTheme.textSecondary}
          />
          <Text
            style={[
              styles.emptyStateText,
              { color: currentTheme.textSecondary },
            ]}
          >
            No notifications yet
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
});

export default NotificationsScreen;
