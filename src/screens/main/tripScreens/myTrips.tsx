import React, { useState, useCallback } from "react";
import { useTheme } from "../../../context/themeContext";
import { useProfile } from "../../../context/profileContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/appNav";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../../../firebase.config";
import {
  Pressable,
  Text,
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  Animated,
} from "react-native";
import { Fontisto } from "@expo/vector-icons";
import StartNewTripCard from "../../../components/myTrips/startNewTripCard";
import CurrentTripsCard from "../../../components/myTrips/currentTripCard";
import UpcomingTripsCard from "../../../components/myTrips/upcomingTripsCard";
import PastTripListCard from "../../../components/myTrips/pastTripListCard";
import moment from "moment";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type MyTripsScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

const MyTrips: React.FC = () => {
  const { currentTheme } = useTheme();
  const { displayName } = useProfile();
  const [userTrips, setUserTrips] = useState<any[] | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const navigation = useNavigation<MyTripsScreenNavigationProp>();
  const ITEMS_TO_SHOW = 6;

  const user = FIREBASE_AUTH.currentUser;

  useFocusEffect(
    useCallback(() => {
      if (user) {
        GetMyTrips();
        // Fetch username if displayName is not available
        if (!displayName) {
          fetchUserName();
        }
      }
    }, [user, displayName])
  );

  const fetchUserName = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(FIREBASE_DB, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserName(data?.name || data?.username || "");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const GetMyTrips = async () => {
    try {
      if (!user) return;

      // Get all trips from the userTrips collection
      const tripsRef = collection(FIREBASE_DB, `users/${user.uid}/userTrips`);
      const snapshot = await getDocs(tripsRef);

      // Map the documents and determine their current status based on dates
      const allTrips = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const id = docSnapshot.id;
          const startDate = moment(data.tripData?.startDate);
          const endDate = moment(data.tripData?.endDate);
          const today = moment().startOf("day");

          // Determine the current status
          let currentStatus;
          if (startDate.isAfter(today)) {
            currentStatus = "up";
          } else if (endDate.isBefore(today)) {
            currentStatus = "past";
          } else {
            currentStatus = "cur";
          }

          // Check if the status prefix in the ID matches the current status
          const currentPrefix = id.split("_")[0];
          if (currentPrefix !== currentStatus) {
            // Status has changed, need to update the document
            const newId = `${currentStatus}_${id.split("_")[1]}`;
            const oldDocRef = doc(
              FIREBASE_DB,
              `users/${user.uid}/userTrips/${id}`
            );
            const newDocRef = doc(
              FIREBASE_DB,
              `users/${user.uid}/userTrips/${newId}`
            );

            try {
              // Copy the document with the new ID
              await setDoc(newDocRef, {
                ...data,
                docId: newId,
              });
              // Delete the old document
              await deleteDoc(oldDocRef);

              // Return the updated trip data
              return {
                id: newId,
                ...data,
                docId: newId,
                subcollection:
                  currentStatus === "up"
                    ? "upcomingTrips"
                    : currentStatus === "cur"
                    ? "currentTrips"
                    : "pastTrips",
              };
            } catch (error) {
              console.error("Error updating trip status:", error);
              // If update fails, return the original data
              return {
                id: id,
                ...data,
                subcollection:
                  currentPrefix === "up"
                    ? "upcomingTrips"
                    : currentPrefix === "cur"
                    ? "currentTrips"
                    : "pastTrips",
              };
            }
          }

          // If no update needed, return the original data
          return {
            id: id,
            ...data,
            subcollection:
              currentPrefix === "up"
                ? "upcomingTrips"
                : currentPrefix === "cur"
                ? "currentTrips"
                : "pastTrips",
          };
        })
      );

      setUserTrips(allTrips);
    } catch (error) {
      console.error("Error fetching user trips:", error);
      setUserTrips([]);
    }
  };

  // Only render content when we have fetched the data
  if (userTrips === null) {
    return (
      <View
        style={[styles.container, { backgroundColor: currentTheme.background }]}
      />
    );
  }

  const getPastTrips = () => {
    return userTrips
      .filter((trip) => trip.subcollection === "pastTrips")
      .sort((a, b) => {
        const dateA = moment(a.tripData.endDate);
        const dateB = moment(b.tripData.endDate);
        return dateB.diff(dateA); // Most recent first
      })
      .slice(0, ITEMS_TO_SHOW);
  };

  const sortedUpcomingTrips = userTrips
    .filter((trip) => trip.subcollection === "upcomingTrips")
    .sort((a, b) => {
      const dateA = moment(a.tripData.startDate);
      const dateB = moment(b.tripData.startDate);
      return dateA.diff(dateB);
    })
    .slice(0, ITEMS_TO_SHOW);

  const totalUpcomingTrips = userTrips.filter(
    (trip) => trip.subcollection === "upcomingTrips"
  ).length;

  const totalPastTrips = userTrips.filter(
    (trip) => trip.subcollection === "pastTrips"
  ).length;

  const hasCurrentTrip = userTrips.some(
    (trip) => trip.subcollection === "currentTrips"
  );

  const getCurrentTrips = () => {
    return userTrips.filter((trip) => trip.subcollection === "currentTrips");
  };

  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: currentTheme.background,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text
            style={[styles.headerTitle, { color: currentTheme.textPrimary }]}
          >
            {`${displayName?.split(" ")[0]}'s` ||
              `${userName?.split(" ")[0]}'s` ||
              "My"}{" "}
            Trips ✈️
          </Text>
          <Pressable
            style={[
              styles.addButton,
              { backgroundColor: currentTheme.alternate },
            ]}
            onPress={() => navigation.navigate("WhereTo")}
          >
            <Fontisto
              name="plus-a"
              size={24}
              color={currentTheme.background}
              style={styles.addIcon}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {userTrips.length === 0 ? (
          <StartNewTripCard navigation={navigation} />
        ) : (
          <View style={styles.tripsContainer}>
            {hasCurrentTrip && (
              <>
                <View style={styles.sectionHeaderContainer}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: currentTheme.textPrimary },
                    ]}
                  >
                    Current Trip
                  </Text>
                </View>
                <CurrentTripsCard userTrips={userTrips} />
              </>
            )}

            <View style={styles.sectionHeaderContainer}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: currentTheme.textPrimary },
                ]}
              >
                Upcoming Trips
              </Text>
              {totalUpcomingTrips >= 3 && (
                <Pressable
                  style={styles.seeAllButton}
                  onPress={() => {
                    const upcomingTrips = userTrips.filter((trip) => {
                      const startDate = moment(trip.tripData.startDate).startOf(
                        "day"
                      );
                      return startDate.isAfter(moment().startOf("day"));
                    });
                    if (upcomingTrips.length > 0) {
                      navigation.navigate("AllTripsView", {
                        trips: JSON.stringify(upcomingTrips),
                        type: "upcoming",
                      });
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.seeAllText,
                      { color: currentTheme.alternate },
                    ]}
                  >
                    See All
                  </Text>
                </Pressable>
              )}
            </View>
            {sortedUpcomingTrips.length > 0 ? (
              <View>
                <FlatList
                  data={sortedUpcomingTrips}
                  horizontal
                  renderItem={({ item }) => (
                    <View style={styles.upcomingTripCard}>
                      <UpcomingTripsCard userTrips={[item]} />
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.upcomingTripsContainer}
                  ListFooterComponent={() =>
                    totalUpcomingTrips > ITEMS_TO_SHOW ? (
                      <Pressable
                        style={styles.seeMoreButton}
                        onPress={() => console.log("See all upcoming trips")}
                      >
                        <Text
                          style={[
                            styles.seeMoreText,
                            { color: currentTheme.alternate },
                          ]}
                        >
                          See All ({totalUpcomingTrips})
                        </Text>
                      </Pressable>
                    ) : null
                  }
                />
              </View>
            ) : (
              <Pressable
                style={styles.noUpcomingTripsContainer}
                onPress={() => navigation.navigate("WhereTo")}
              >
                <MaterialCommunityIcons
                  name="calendar-plus"
                  size={24}
                  color={currentTheme.textSecondary}
                />
                <Text
                  style={[
                    styles.noUpcomingTripsText,
                    { color: currentTheme.textSecondary },
                  ]}
                >
                  No upcoming trips planned
                </Text>
                <Text
                  style={[
                    styles.addTripText,
                    { color: currentTheme.alternate },
                  ]}
                >
                  Tap to plan a new adventure
                </Text>
              </Pressable>
            )}

            {totalPastTrips > 0 && (
              <>
                <View style={styles.sectionHeaderContainer}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: currentTheme.textPrimary },
                    ]}
                  >
                    Past Trips
                  </Text>
                  {totalPastTrips >= 3 && (
                    <Pressable
                      style={styles.seeAllButton}
                      onPress={() => {
                        const pastTrips = userTrips.filter((trip) =>
                          moment(trip.tripData.endDate).isBefore(
                            moment(),
                            "day"
                          )
                        );
                        if (pastTrips.length > 0) {
                          navigation.navigate("AllTripsView", {
                            trips: JSON.stringify(pastTrips),
                            type: "past",
                          });
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.seeAllText,
                          { color: currentTheme.alternate },
                        ]}
                      >
                        See All
                      </Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.pastTripsContainer}>
                  {getPastTrips().map((trip, index) => {
                    if (!trip || !trip.tripData || !trip.tripPlan) {
                      console.warn(
                        `Skipping invalid trip at index ${index}:`,
                        trip
                      );
                      return null;
                    }
                    return (
                      <PastTripListCard
                        trip={{
                          tripData: trip.tripData,
                          tripPlan: trip.tripPlan,
                          id: trip.id,
                        }}
                        key={index}
                      />
                    );
                  })}
                  {totalPastTrips > ITEMS_TO_SHOW && (
                    <Pressable
                      style={styles.seeMoreButton}
                      onPress={() => console.log("See all past trips")}
                    >
                      <Text
                        style={[
                          styles.seeMoreText,
                          { color: currentTheme.alternate },
                        ]}
                      >
                        See All ({totalPastTrips})
                      </Text>
                    </Pressable>
                  )}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
  },
  smheaderTitle: {
    fontSize: 23,
    fontWeight: "800",
  },
  addButton: {
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    width: 24,
    height: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  tripsContainer: {
    flex: 1,
    gap: 20,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  seeAllButton: {
    padding: 8,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: "600",
  },
  upcomingTripCard: {
    marginRight: 15,
  },
  upcomingTripsContainer: {
    paddingVertical: 10,
  },
  pastTripsContainer: {
    gap: 15,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  noTripImage: {
    width: "100%",
    height: 240,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    justifyContent: "flex-end",
    padding: 20,
  },
  contentContainer: {
    flex: 1,
  },
  noTripContent: {
    alignItems: "center",
    gap: 12,
  },
  noTripText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  createTripButtonContainer: {
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  createTripButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  createTripText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "600",
  },
  tapToStartText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontStyle: "italic",
  },
  seeMoreButton: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  seeMoreText: {
    fontSize: 16,
    fontWeight: "600",
  },
  noUpcomingTripsContainer: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  noUpcomingTripsText: {
    fontSize: 16,
    fontWeight: "500",
  },
  addTripText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default MyTrips;
