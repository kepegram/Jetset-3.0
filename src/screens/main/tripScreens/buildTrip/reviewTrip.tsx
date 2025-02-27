import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Animated as RNAnimated,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useContext, useCallback } from "react";
import { CreateTripContext } from "../../../../context/createTripContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/appNav";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../../context/themeContext";
import moment from "moment";
import { MainButton } from "../../../../components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import CalendarPicker from "react-native-calendar-picker";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { travelOptions, TravelOption } from "./whosGoing";
import { activityOptions, budgetOptions, SelectionOption } from "./moreInfo";

type ReviewTripScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ReviewTrip"
>;

const ReviewTrip: React.FC = () => {
  const { currentTheme } = useTheme();
  const navigation = useNavigation<ReviewTripScreenNavigationProp>();
  const { tripData, setTripData } = useContext(CreateTripContext) || {};
  const [localTripData, setLocalTripData] = useState(tripData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

  const overlayAnim = React.useRef(new RNAnimated.Value(0)).current;
  const slideAnim = React.useRef(new RNAnimated.Value(0)).current;

  const animateModal = (show: boolean) => {
    RNAnimated.parallel([
      RNAnimated.timing(overlayAnim, {
        toValue: show ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      RNAnimated.spring(slideAnim, {
        toValue: show ? 1 : 0,
        tension: 65,
        friction: show ? 11 : 9,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!show) {
        setEditingField(null);
        setTempStartDate(null);
        setTempEndDate(null);
      }
    });
  };

  const handleOpenModal = (field: string) => {
    if (field === "dates") {
      setTempStartDate(moment(tripData?.startDate).toDate());
      setTempEndDate(moment(tripData?.endDate).toDate());
    }
    setEditingField(field);
    animateModal(true);
  };

  const handleCloseModal = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    animateModal(false);
  };

  const handleSaveChanges = useCallback(
    (newValue: any) => {
      if (!editingField || !setTripData) return;

      const updatedTripData = { ...tripData };

      switch (editingField) {
        case "destination":
          updatedTripData.locationInfo = {
            ...updatedTripData.locationInfo,
            name: newValue.description,
          };
          break;
        case "dates":
          updatedTripData.startDate = newValue.startDate;
          updatedTripData.endDate = newValue.endDate;
          updatedTripData.totalNoOfDays =
            moment(newValue.endDate).diff(moment(newValue.startDate), "days") +
            1;
          break;
        case "travelers":
          updatedTripData.whoIsGoing = newValue;
          break;
        case "budget":
          updatedTripData.budget = newValue;
          break;
        case "activity":
          updatedTripData.activityLevel = newValue;
          break;
      }

      setTripData(updatedTripData);
      setEditingField(null);
    },
    [editingField, tripData, setTripData]
  );

  const handleSaveDates = () => {
    if (tempStartDate && tempEndDate && tripData) {
      const totalNoOfDays =
        moment(tempEndDate).diff(moment(tempStartDate), "days") + 1;
      setTripData?.({
        ...tripData,
        startDate: tempStartDate,
        endDate: tempEndDate,
        totalNoOfDays,
      });
    }
    handleCloseModal();
  };

  const getGooglePlacesStyles = () => ({
    container: { flex: 0 },
    textInput: {
      ...styles.textInput,
      color: currentTheme.textPrimary,
      backgroundColor: `${currentTheme.secondary}15`,
      borderColor: `${currentTheme.alternate}30`,
    },
    listView: {
      backgroundColor: currentTheme.background,
    },
    row: {
      backgroundColor: currentTheme.background,
      padding: 15,
    },
    description: {
      color: currentTheme.textPrimary,
    },
    separator: {
      backgroundColor: `${currentTheme.textSecondary}20`,
      height: 1,
    },
  });

  const renderEditContent = () => {
    switch (editingField) {
      case "destination":
        return (
          <GooglePlacesAutocomplete
            placeholder="Search destinations..."
            onPress={(data, details) => handleSaveChanges(data)}
            query={{
              // @ts-ignore - Environment variable access
              key: process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY,
              language: "en",
            }}
            styles={getGooglePlacesStyles()}
          />
        );

      case "dates":
        return (
          <View
            style={[
              styles.calendarWrapper,
              { backgroundColor: currentTheme.alternate + "20" },
            ]}
          >
            <View style={styles.dateRangeWrapper}>
              <View
                style={[
                  styles.dateRangeContainer,
                  { backgroundColor: currentTheme.alternate + "20" },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={currentTheme.textSecondary}
                />
                <Text
                  style={[
                    styles.dateRangeText,
                    { color: currentTheme.textSecondary },
                  ]}
                >
                  {tempStartDate && tempEndDate
                    ? `${moment(tempStartDate).format("MMM D")} - ${moment(
                        tempEndDate
                      ).format("MMM D, YYYY")} • ${moment(tempEndDate).diff(
                        moment(tempStartDate),
                        "days"
                      )} nights`
                    : "Select your travel dates"}
                </Text>
              </View>
              {(tempStartDate || tempEndDate) && (
                <Ionicons
                  name="refresh-outline"
                  size={24}
                  color={currentTheme.textSecondary}
                  onPress={() => {
                    setTempStartDate(null);
                    setTempEndDate(null);
                  }}
                  style={[
                    styles.resetIcon,
                    { backgroundColor: currentTheme.alternate + "20" },
                  ]}
                />
              )}
            </View>

            <CalendarPicker
              onDateChange={(date: Date, type: string) => {
                if (type === "START_DATE") {
                  setTempStartDate(date);
                  if (tempEndDate && moment(date).isAfter(tempEndDate)) {
                    setTempEndDate(null);
                  }
                } else {
                  setTempEndDate(date);
                }
              }}
              allowRangeSelection={true}
              minDate={new Date()}
              selectedStartDate={tempStartDate || undefined}
              selectedEndDate={tempEndDate || undefined}
              previousComponent={
                <Ionicons
                  name="chevron-back"
                  size={34}
                  color={currentTheme.textPrimary}
                />
              }
              nextComponent={
                <Ionicons
                  name="chevron-forward"
                  size={34}
                  color={currentTheme.textPrimary}
                />
              }
              selectedRangeStyle={{
                backgroundColor: `${currentTheme.alternate}50`,
              }}
              selectedDayStyle={{
                backgroundColor: currentTheme.alternate,
              }}
              selectedDayTextStyle={{
                color: "#FFFFFF",
                fontWeight: "600",
              }}
              textStyle={{ color: currentTheme.textPrimary }}
              dayTextStyle={{ color: currentTheme.textPrimary }}
              monthTitleStyle={{
                color: currentTheme.textPrimary,
                fontSize: 20,
                fontWeight: "700",
              }}
              yearTitleStyle={{
                color: currentTheme.textPrimary,
                fontSize: 20,
                fontWeight: "700",
              }}
              width={Dimensions.get("window").width - 80}
              height={380}
              scaleFactor={375}
            />
          </View>
        );

      case "travelers":
        return (
          <View style={styles.optionsContainer}>
            {travelOptions.map((option: TravelOption) => (
              <Pressable
                key={option.value}
                onPress={() => handleSaveChanges(option.label)}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    backgroundColor: currentTheme.background,
                    borderColor:
                      tripData?.whoIsGoing === option.label
                        ? currentTheme.alternate
                        : currentTheme.secondary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor:
                          tripData?.whoIsGoing === option.label
                            ? currentTheme.alternate
                            : `${currentTheme.secondary}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={
                        tripData?.whoIsGoing === option.label
                          ? "white"
                          : currentTheme.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: currentTheme.textPrimary },
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
                </View>
              </Pressable>
            ))}
          </View>
        );

      case "budget":
        return (
          <View style={styles.optionsContainer}>
            {budgetOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleSaveChanges(option.value)}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    backgroundColor: currentTheme.background,
                    borderColor:
                      tripData?.budget === option.value
                        ? currentTheme.alternate
                        : currentTheme.secondary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor:
                          tripData?.budget === option.value
                            ? currentTheme.alternate
                            : `${currentTheme.secondary}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={
                        tripData?.budget === option.value
                          ? "white"
                          : currentTheme.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: currentTheme.textPrimary },
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
                </View>
              </Pressable>
            ))}
          </View>
        );

      case "activity":
        return (
          <View style={styles.optionsContainer}>
            {activityOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleSaveChanges(option.value)}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    backgroundColor: currentTheme.background,
                    borderColor:
                      tripData?.activityLevel === option.value
                        ? currentTheme.alternate
                        : currentTheme.secondary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor:
                          tripData?.activityLevel === option.value
                            ? currentTheme.alternate
                            : `${currentTheme.secondary}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={
                        tripData?.activityLevel === option.value
                          ? "white"
                          : currentTheme.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: currentTheme.textPrimary },
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
                </View>
              </Pressable>
            ))}
          </View>
        );
    }
  };

  useEffect(() => {
    setLocalTripData(tripData);
  }, [tripData]);

  const renderInfoCard = (
    emoji: string,
    label: string,
    value: string,
    field: string
  ) => (
    <View
      style={[
        styles.infoContainer,
        { backgroundColor: currentTheme.accentBackground },
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.infoTextContainer}>
        <Text style={[styles.label, { color: currentTheme.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.value, { color: currentTheme.textPrimary }]}>
          {value}
        </Text>
      </View>
      <Pressable
        onPress={() => handleOpenModal(field)}
        style={styles.editButton}
      >
        <Ionicons name="pencil" size={20} color={currentTheme.textSecondary} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.contentContainer}>
        {/* Header Section */}
        <Text style={[styles.subtitle, { color: currentTheme.textPrimary }]}>
          Review your trip details 🔍
        </Text>
        <Text style={[styles.title, { color: currentTheme.textSecondary }]}>
          Tap the edit icon to make changes
        </Text>

        <View style={styles.reviewContainer}>
          {renderInfoCard(
            "📍",
            "Destination",
            localTripData?.destinationType ||
              localTripData?.locationInfo?.name ||
              localTripData?.name,
            "destination"
          )}

          {renderInfoCard(
            "🗓️",
            "Travel Date",
            `${moment(localTripData?.startDate).format("MMM DD")} - ${moment(
              localTripData?.endDate
            ).format("MMM DD")} (${localTripData?.totalNoOfDays} days)`,
            "dates"
          )}

          {renderInfoCard(
            "🚌",
            "Who is Traveling",
            localTripData?.whoIsGoing,
            "travelers"
          )}

          {renderInfoCard("💰", "Budget", localTripData?.budget, "budget")}

          {renderInfoCard(
            "🏃‍♂️",
            "Activity Level",
            localTripData?.activityLevel,
            "activity"
          )}
        </View>

        {/* Generate Trip Button */}
        <View style={styles.buttonContainer}>
          <MainButton
            onPress={() => navigation.navigate("GenerateTrip")}
            buttonText="Build My Trip"
            style={styles.button}
            backgroundColor={currentTheme.alternate}
            width="85%"
          />

          {/* Debug Button for Testing */}
          <Pressable
            onPress={() => {
              // Log the entire tripData object with formatting
              console.log(
                "Trip Data for Testing:",
                JSON.stringify(tripData, null, 2)
              );

              // Show a simple alert
              alert("Trip data logged to console");
            }}
            style={({ pressed }) => [
              styles.debugButton,
              {
                backgroundColor: pressed
                  ? `${currentTheme.secondary}30`
                  : `${currentTheme.secondary}15`,
                borderColor: currentTheme.secondary,
              },
            ]}
          >
            <Ionicons
              name="code-outline"
              size={18}
              color={currentTheme.textSecondary}
              style={styles.debugIcon}
            />
            <Text
              style={[
                styles.debugButtonText,
                { color: currentTheme.textSecondary },
              ]}
            >
              Log Trip Data (Debug)
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Edit Modal */}
      {editingField && (
        <RNAnimated.View
          style={[
            styles.modalOverlay,
            {
              opacity: overlayAnim,
            },
          ]}
        >
          <RNAnimated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: currentTheme.background,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: currentTheme.textPrimary },
                  ]}
                >
                  Edit {editingField}
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: currentTheme.textSecondary },
                  ]}
                >
                  Make changes to your trip details
                </Text>
              </View>
              <Pressable
                onPress={handleCloseModal}
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    backgroundColor: pressed
                      ? `${currentTheme.secondary}20`
                      : `${currentTheme.secondary}10`,
                  },
                ]}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={currentTheme.textPrimary}
                />
              </Pressable>
            </View>

            <View style={styles.modalBody}>{renderEditContent()}</View>

            <View style={styles.modalFooter}>
              <MainButton
                onPress={() => {
                  if (editingField === "dates") {
                    handleSaveDates();
                  } else {
                    handleCloseModal();
                  }
                }}
                buttonText="Save Changes"
                backgroundColor={currentTheme.alternate}
                width="100%"
              />
            </View>
          </RNAnimated.View>
        </RNAnimated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  reviewContainer: {
    flex: 1,
    marginTop: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: "outfit",
    opacity: 0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 32,
    fontFamily: "outfit-bold",
    marginBottom: 8,
    lineHeight: 38,
  },
  infoContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: "outfit",
    opacity: 0.8,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontFamily: "outfit-medium",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  button: {
    marginTop: 0,
  },
  editButton: {
    padding: 8,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: "60%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  modalHeaderContent: {
    flex: 1,
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontFamily: "outfit-bold",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: "outfit",
    opacity: 0.8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
  },
  modalBody: {
    flex: 1,
    marginBottom: 24,
  },
  modalFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  dateRangeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  dateRangeContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  dateRangeText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: "500",
    fontFamily: "outfit",
  },
  resetIcon: {
    padding: 8,
    borderRadius: 8,
  },
  calendarWrapper: {
    marginTop: 16,
    alignItems: "center",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  optionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
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
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: "outfit-medium",
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: "outfit",
    opacity: 0.8,
  },
  textInput: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: "outfit",
  },
  debugButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  debugButtonText: {
    fontSize: 14,
    fontFamily: "outfit",
  },
  debugIcon: {
    marginRight: 6,
  },
});

export default ReviewTrip;
