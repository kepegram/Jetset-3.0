import React, { useState, useCallback } from "react";
import { useTheme } from "../../../context/themeContext";
import { useProfile } from "../../../context/profileContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/appNav";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { FIREBASE_AUTH } from "../../../../firebase.config";
import {
  Pressable,
  Text,
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  Animated,
  RefreshControl,
} from "react-native";
import { Fontisto } from "@expo/vector-icons";
import moment from "moment";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import StartNewTripCard from "../../../components/myTrips/startNewTripCard";
import CurrentTripsCard from "../../../components/myTrips/currentTripCard";
import UpcomingTripsCard from "../../../components/myTrips/upcomingTripsCard";
import PastTripListCard from "../../../components/myTrips/pastTripListCard";
import { fetchUserName, fetchUserTrips } from "../../../services/tripService";
import { ErrorBoundary } from "../../../components/common";

type MyTripsScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

const MyTrips: React.FC = () => {
  const { currentTheme } = useTheme();
  const { displayName } = useProfile();
  const [userTrips, setUserTrips] = useState<any[] | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<MyTripsScreenNavigationProp>();
  const ITEMS_TO_SHOW = 6;

  const user = FIREBASE_AUTH.currentUser;

  const loadTrips = useCallback(async () => {
    if (!user) return;
    try {
      const trips = await fetchUserTrips(user.uid);
      setUserTrips(trips);
    } catch (error) {
      setUserTrips([]);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, [loadTrips]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadTrips();
        if (!displayName) {
          fetchUserName(user.uid)
            .then(setUserName)
            .catch((error) =>
              console.error("Error fetching user name:", error)
            );
        }
      }
      return () => {
        // Cleanup if needed
      };
    }, [user, displayName, loadTrips])
  );

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
      .filter((trip) => trip.subcollection === "past")
      .sort((a, b) => {
        const dateA = moment(a.tripData.endDate);
        const dateB = moment(b.tripData.endDate);
        return dateB.diff(dateA); // Most recent first
      })
      .slice(0, ITEMS_TO_SHOW);
  };

  const sortedUpcomingTrips = userTrips
    .filter((trip) => trip.subcollection === "upcoming")
    .sort((a, b) => {
      const dateA = moment(a.tripData.startDate);
      const dateB = moment(b.tripData.startDate);
      return dateA.diff(dateB);
    })
    .slice(0, ITEMS_TO_SHOW);

  const totalUpcomingTrips = userTrips.filter(
    (trip) => trip.subcollection === "upcoming"
  ).length;

  const totalPastTrips = userTrips.filter(
    (trip) => trip.subcollection === "past"
  ).length;

  const hasCurrentTrip = userTrips.some(
    (trip) => trip.subcollection === "current"
  );

  const getCurrentTrips = () => {
    return userTrips.filter((trip) => trip.subcollection === "current");
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
    <ErrorBoundary>
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
              {displayName
                ? `${displayName.split(" ")[0]}'s`
                : userName
                ? `${userName.split(" ")[0]}'s`
                : "My"}{" "}
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
                color="white"
                style={styles.addIcon}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
                  <CurrentTripsCard userTrips={getCurrentTrips()} />
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
                        const startDate = moment(
                          trip.tripData.startDate
                        ).startOf("day");
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
    </ErrorBoundary>
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
  upcomingTripsContainer: {
    paddingRight: 20,
  },
  upcomingTripCard: {
    marginRight: 15,
  },
  pastTripsContainer: {
    gap: 15,
  },
  seeMoreButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  seeMoreText: {
    fontSize: 16,
    fontWeight: "600",
  },
  noUpcomingTripsContainer: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginVertical: 10,
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
