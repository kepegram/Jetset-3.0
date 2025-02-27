import {
  View,
  Text,
  Image,
  ScrollView,
  Alert,
  Linking,
  StyleSheet,
  Dimensions,
  Pressable,
  StatusBar,
  Modal,
  Animated,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "../../../../context/themeContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/appNav";
import { useNavigation, useRoute } from "@react-navigation/native";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../../../../firebase.config";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import moment from "moment";
import HotelList from "../../../../components/tripDetails/hotelList";
import PlannedTrip from "../../../../components/tripDetails/plannedTrip";
import { MainButton } from "../../../../components/ui/button";

const { width, height } = Dimensions.get("window");

// Import travel options from WhosGoing
export interface TravelOption {
  value: number;
  label: string;
  description: string;
  icon: string;
}

export const travelOptions: TravelOption[] = [
  {
    value: 1,
    label: "Solo",
    description: "Adventure at your own pace",
    icon: "person-outline",
  },
  {
    value: 2,
    label: "Couple",
    description: "Perfect for two",
    icon: "people-outline",
  },
  {
    value: 3,
    label: "Small Group",
    description: "3-4 travelers",
    icon: "people",
  },
  {
    value: 4,
    label: "Large Group",
    description: "5+ travelers",
    icon: "people-circle-outline",
  },
];

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TripDetails"
>;

interface RouteParams {
  trip: string;
  photoRef: string;
  docId: string;
}

const TripDetails: React.FC = () => {
  const { currentTheme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { trip, photoRef, docId } = route.params as RouteParams;

  const [tripDetails, setTripDetails] = useState<any>(null);
  const user = FIREBASE_AUTH.currentUser;

  // State for edit modal
  const [whoModalVisible, setWhoModalVisible] = useState(false);
  const [whoIsGoing, setWhoIsGoing] = useState<number>(1);
  const [isUpdating, setIsUpdating] = useState(false);

  // Add animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "",
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </Pressable>
      ),
    });

    try {
      const parsedTrip = JSON.parse(trip);
      setTripDetails(parsedTrip);

      // Set who is going based on the trip data
      const whoOption = travelOptions.find(
        (opt) => opt.label === parsedTrip?.whoIsGoing
      );
      if (whoOption) {
        setWhoIsGoing(whoOption.value);
      }
    } catch (error) {
      console.error("Error parsing trip details:", error);
    }
  }, [trip, navigation]);

  const deleteTrip = async (tripId: string) => {
    try {
      Alert.alert("Delete Trip", "Are you sure you want to delete this trip?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            const tripDocRef = doc(
              FIREBASE_DB,
              `users/${user.uid}/userTrips/${tripId}`
            );
            await deleteDoc(tripDocRef);
            console.log(`Trip with ID ${tripId} deleted successfully.`);
            navigation.navigate("MyTripsMain");
          },
        },
      ]);
    } catch (error) {
      console.error("Failed to delete trip:", error);
    }
  };

  // Handle option select for who's going
  const handleOptionSelect = (value: number) => {
    setWhoIsGoing(value);
  };

  // Animation functions
  const showModal = () => {
    setWhoModalVisible(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        damping: 20,
        mass: 0.8,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalTranslateY, {
        toValue: height,
        damping: 20,
        mass: 0.8,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setWhoModalVisible(false);
    });
  };

  // Save updated who's going to Firestore
  const saveWhoChanges = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const tripDocRef = doc(
        FIREBASE_DB,
        `users/${user.uid}/userTrips/${docId}`
      );

      // Get the selected option
      const selectedOption = travelOptions.find(
        (opt) => opt.value === whoIsGoing
      );
      if (!selectedOption) return;

      // Update trip details in state
      const updatedTripDetails = {
        ...tripDetails,
        whoIsGoing: selectedOption.label,
      };

      // Update Firestore
      await updateDoc(tripDocRef, {
        whoIsGoing: selectedOption.label,
      });

      setTripDetails(updatedTripDetails);
      hideModal();
    } catch (error) {
      console.error("Error updating travel companions:", error);
      Alert.alert(
        "Error",
        "Failed to update travel companions. Please try again."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (!tripDetails) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: currentTheme.background },
        ]}
      >
        <Ionicons name="airplane" size={50} color={currentTheme.alternate} />
        <Text style={[styles.loadingText, { color: currentTheme.textPrimary }]}>
          Loading trip details...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                photoRef || tripDetails?.photoRef
                  ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${
                      photoRef || tripDetails?.photoRef
                      // @ts-ignore
                    }&key=${process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY}`
                  : "https://via.placeholder.com/800",
            }}
            style={styles.image}
          />
        </View>

        <View
          style={[
            styles.contentContainer,
            { backgroundColor: currentTheme.background },
          ]}
        >
          <View style={styles.headerContainer}>
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.destinationTitle,
                  { color: currentTheme.textPrimary },
                ]}
              >
                {tripDetails?.travelPlan?.destination || "Unknown Location"}
              </Text>
              <Pressable onPress={() => deleteTrip(docId)}>
                <Ionicons
                  name="trash-bin-outline"
                  size={24}
                  color={currentTheme.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.tripMetaContainer}>
            <View
              style={[
                styles.tripMetaItem,
                { backgroundColor: `${currentTheme.alternate}20` },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color={currentTheme.alternate}
              />
              <Text
                style={[
                  styles.tripMetaText,
                  { color: currentTheme.textPrimary },
                ]}
              >
                {moment(tripDetails?.startDate).format("MMM DD")} -{" "}
                {moment(tripDetails?.endDate).format("MMM DD")}
              </Text>
            </View>
            <Pressable
              style={[
                styles.tripMetaItem,
                { backgroundColor: `${currentTheme.alternate}20` },
              ]}
              onPress={showModal}
            >
              <Ionicons
                name="people-outline"
                size={22}
                color={currentTheme.alternate}
              />
              <Text
                style={[
                  styles.tripMetaText,
                  { color: currentTheme.textPrimary },
                ]}
              >
                {tripDetails?.whoIsGoing || "Unknown"}
              </Text>
              <Ionicons
                name="pencil-outline"
                size={16}
                color={currentTheme.alternate}
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          </View>

          <View
            style={[
              styles.flightContainer,
              { backgroundColor: currentTheme.background },
            ]}
          >
            <View style={styles.flightInfo}>
              <View style={styles.airlineWrapper}>
                <Text
                  style={[
                    styles.airlineName,
                    { color: currentTheme.textPrimary },
                  ]}
                >
                  {tripDetails?.travelPlan?.flights?.airlineName ||
                    "Unknown Airline"}
                </Text>
              </View>
              <View style={styles.priceWrapper}>
                <Text
                  style={[
                    styles.priceLabel,
                    { color: currentTheme.textSecondary },
                  ]}
                >
                  Approximate Price
                </Text>
                <Text style={[styles.price, { color: currentTheme.alternate }]}>
                  ~${tripDetails?.travelPlan?.flights?.flightPrice || "N/A"}
                </Text>
              </View>
            </View>
            <MainButton
              onPress={() => {
                const url = tripDetails?.travelPlan?.flights?.airlineUrl;
                if (url) {
                  Linking.openURL(url);
                } else {
                  Alert.alert("Booking URL not available");
                }
              }}
              buttonText="Book Now"
              width={width * 0.35}
              style={[
                styles.bookButton,
                { backgroundColor: currentTheme.alternate },
              ]}
            />
          </View>

          <HotelList hotelList={tripDetails?.travelPlan?.hotels} />
          <PlannedTrip details={tripDetails?.travelPlan} />
        </View>
      </ScrollView>

      {/* Who's Going Edit Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={whoModalVisible}
        onRequestClose={hideModal}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: overlayOpacity,
            },
          ]}
        >
          <Pressable style={styles.modalOverlayPressable} onPress={hideModal} />
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: currentTheme.background,
                transform: [{ translateY: modalTranslateY }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, { color: currentTheme.textPrimary }]}
              >
                Edit Travel Companions
              </Text>
              <Pressable onPress={hideModal}>
                <Ionicons
                  name="close"
                  size={24}
                  color={currentTheme.textSecondary}
                />
              </Pressable>
            </View>

            <View style={styles.optionsContainer}>
              {travelOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => handleOptionSelect(option.value)}
                  style={({ pressed }) => [
                    styles.optionCard,
                    {
                      backgroundColor: currentTheme.background,
                      borderColor:
                        whoIsGoing === option.value
                          ? currentTheme.alternate
                          : currentTheme.secondary,
                      transform: [
                        {
                          scale: pressed ? 0.98 : 1,
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor:
                            whoIsGoing === option.value
                              ? currentTheme.alternate
                              : currentTheme.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={24}
                        color={
                          whoIsGoing === option.value
                            ? "white"
                            : currentTheme.textSecondary
                        }
                      />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text
                        style={[
                          styles.optionTitle,
                          {
                            color: currentTheme.textPrimary,
                            fontWeight:
                              whoIsGoing === option.value ? "600" : "400",
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.optionDescription,
                          { color: currentTheme.textSecondary },
                        ]}
                      >
                        {option.description}
                      </Text>
                    </View>
                    {whoIsGoing === option.value && (
                      <MaterialIcons
                        name="check-circle"
                        size={24}
                        color={currentTheme.alternate}
                        style={styles.checkIcon}
                      />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalButtonContainer}>
              <MainButton
                buttonText="Cancel"
                onPress={hideModal}
                width="48%"
                backgroundColor={currentTheme.secondary}
                style={{ borderRadius: 12 }}
              />
              <MainButton
                buttonText="Save Changes"
                onPress={saveWhoChanges}
                width="48%"
                backgroundColor={currentTheme.alternate}
                style={{ borderRadius: 12 }}
                disabled={isUpdating}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingText: {
    fontFamily: "outfit-medium",
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    height: height * 0.5,
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    flex: 1,
  },
  headerContainer: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  destinationTitle: {
    fontSize: 32,
    fontFamily: "outfit-bold",
    letterSpacing: 0.5,
  },
  tripMetaContainer: {
    flexDirection: "row",
    marginBottom: 25,
    gap: 15,
  },
  tripMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tripMetaText: {
    fontFamily: "outfit-medium",
    fontSize: 16,
    marginLeft: 8,
  },
  flightContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  flightInfo: {
    flex: 1,
    gap: 8,
  },
  airlineWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  airlineName: {
    fontFamily: "outfit-bold",
    fontSize: 18,
  },
  priceWrapper: {
    gap: 2,
  },
  priceLabel: {
    fontFamily: "outfit",
    fontSize: 14,
  },
  price: {
    fontFamily: "outfit-bold",
    fontSize: 24,
  },
  bookButton: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
    borderRadius: 15,
  },
  backButton: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.3)",
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalOverlayPressable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "outfit-bold",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  // Calendar styles
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignItems: "center",
    marginBottom: 24,
  },
  dateRangeSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  dateRangeDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateBlock: {
    alignItems: "center",
    width: 80,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: "outfit-medium",
    color: "#707070",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 20,
    fontFamily: "outfit-bold",
    color: "#000000",
  },
  yearValue: {
    fontSize: 14,
    fontFamily: "outfit",
    color: "#707070",
    marginTop: 2,
  },
  dateRangeDivider: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D0D0D0",
  },
  nightsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 8,
  },
  nightsCount: {
    fontSize: 16,
    fontFamily: "outfit-bold",
  },
  nightsLabel: {
    fontSize: 10,
    fontFamily: "outfit",
  },
  // Who's going styles
  optionsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  optionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: "outfit-bold",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: "outfit",
    opacity: 0.8,
  },
  checkIcon: {
    marginLeft: 12,
  },
});

export default TripDetails;
