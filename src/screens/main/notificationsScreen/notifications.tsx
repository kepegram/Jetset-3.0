import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
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
  deleteDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../../../firebase.config";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
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

  const deleteNotification = async (id: string) => {
    const user = getAuth().currentUser;
    if (!user) return;

    try {
      const notificationRef = doc(
        FIREBASE_DB,
        `users/${user.uid}/notifications/${id}`
      );
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    const user = getAuth().currentUser;
    if (!user) return;

    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to delete all notifications?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              const batch = writeBatch(FIREBASE_DB);
              const notificationsRef = collection(
                FIREBASE_DB,
                `users/${user.uid}/notifications`
              );
              const snapshot = await getDocs(notificationsRef);

              snapshot.forEach((doc) => {
                batch.delete(doc.ref);
              });

              await batch.commit();
            } catch (error) {
              console.error("Error clearing notifications:", error);
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (
    id: string,
    progress: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });

    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
    });

    return (
      <Animated.View
        style={[
          styles.deleteActionContainer,
          {
            transform: [{ translateX }],
            opacity,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.deleteAction,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => deleteNotification(id)}
        >
          <View style={styles.deleteIconContainer}>
            <Ionicons name="trash-outline" size={22} color="white" />
            <Text style={styles.deleteText}>Delete</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Swipeable
      renderRightActions={(progress) => renderRightActions(item.id, progress)}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
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
                !item.read && styles.unreadText,
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
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          <Text
            style={[styles.headerTitle, { color: currentTheme.textPrimary }]}
          >
            Notifications
          </Text>
          {notifications.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.clearButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={clearAllNotifications}
            >
              <Text style={[styles.clearButtonText, { color: "#FF3B30" }]}>
                Clear All
              </Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentTheme.alternate} />
          </View>
        ) : notifications.length > 0 ? (
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
    </GestureHandlerRootView>
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
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
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
  },
  unreadText: {
    fontWeight: "700",
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
  },
  notificationTime: {
    fontSize: 12,
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
  },
  deleteActionContainer: {
    width: 100,
    marginBottom: 12,
    height: undefined,
    alignSelf: "stretch",
  },
  deleteAction: {
    flex: 1,
    backgroundColor: "rgba(255, 59, 48, 0.9)",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  deleteIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  clearButton: {
    marginLeft: "auto",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default NotificationsScreen;
