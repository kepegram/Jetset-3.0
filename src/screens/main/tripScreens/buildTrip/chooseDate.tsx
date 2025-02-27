import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import React, { useContext, useCallback, useState, useEffect } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../navigation/appNav";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../../context/themeContext";
import { MainButton } from "../../../../components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import CalendarPicker from "react-native-calendar-picker";
import { CreateTripContext } from "../../../../context/createTripContext";
import moment, { Moment } from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const { width, height } = Dimensions.get("window");

type ChooseDateNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ChooseDate"
>;

const ChooseDate: React.FC = () => {
  const navigation = useNavigation<ChooseDateNavigationProp>();
  const { currentTheme } = useTheme();
  const { tripData = {}, setTripData = () => {} } =
    useContext(CreateTripContext) || {};
  const [startDate, setStartDate] = useState<Moment | null>(null);
  const [endDate, setEndDate] = useState<Moment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved dates on component mount
  useEffect(() => {
    const loadSavedDates = async () => {
      try {
        const savedStartDate = await AsyncStorage.getItem("startDate");
        const savedEndDate = await AsyncStorage.getItem("endDate");

        if (savedStartDate) {
          setStartDate(moment(savedStartDate));
        }

        if (savedEndDate) {
          setEndDate(moment(savedEndDate));
        }
      } catch (error) {
        console.error("Error loading saved dates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedDates();
  }, []);

  // Handle date selection from calendar
  const onDateChange = useCallback(
    async (date: Date, type: string) => {
      if (!date) return;

      const selectedDate = moment(date);

      try {
        if (type === "START_DATE") {
          // Set start date
          setStartDate(selectedDate);

          // If end date is before or equal to new start date, adjust it to be one day after
          if (endDate && endDate.isSameOrBefore(selectedDate)) {
            const newEndDate = moment(selectedDate).add(1, "days");
            setEndDate(newEndDate);
            await AsyncStorage.setItem("endDate", newEndDate.toISOString());
          }

          await AsyncStorage.setItem("startDate", selectedDate.toISOString());
        } else if (type === "END_DATE") {
          // Only set end date if it's after start date
          if (startDate && selectedDate.isAfter(startDate)) {
            setEndDate(selectedDate);
            await AsyncStorage.setItem("endDate", selectedDate.toISOString());
          } else if (startDate) {
            // If user tries to select an end date before or equal to start date,
            // set end date to be one day after start date
            const newEndDate = moment(startDate).add(1, "days");
            setEndDate(newEndDate);
            await AsyncStorage.setItem("endDate", newEndDate.toISOString());
          }
        }
      } catch (error) {
        console.error("Error saving date to AsyncStorage:", error);
      }
    },
    [startDate, endDate]
  );

  // Handle continue button press after date selection
  const handleDateSelectionContinue = useCallback(() => {
    // Validate date selection
    if (!startDate || !endDate) {
      Alert.alert("Missing Dates", "Please select both start and end dates");
      return;
    }

    if (endDate.isBefore(startDate)) {
      Alert.alert("Invalid Dates", "End date cannot be before start date");
      return;
    }

    // Calculate total number of days
    const totalNoOfDays = endDate.diff(startDate, "days") + 1;

    // Update trip data with selected dates
    setTripData({
      ...tripData,
      startDate,
      endDate,
      totalNoOfDays,
    });

    navigation.navigate("WhosGoing");
  }, [startDate, endDate, tripData, setTripData, navigation]);

  // Reset dates handler
  const handleResetDates = useCallback(async () => {
    setStartDate(null);
    setEndDate(null);
    try {
      await AsyncStorage.removeItem("startDate");
      await AsyncStorage.removeItem("endDate");
    } catch (error) {
      console.error("Error clearing dates from AsyncStorage:", error);
    }
  }, []);

  // Get formatted date range text
  const getDateRangeText = useCallback(() => {
    if (startDate && endDate) {
      const nights = endDate.diff(startDate, "days");
      return `${startDate.format("MMM D")} - ${endDate.format(
        "MMM D, YYYY"
      )} • ${nights} ${nights === 1 ? "night" : "nights"}`;
    }
    return "Select your travel dates";
  }, [startDate, endDate]);

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "light-content"}
        backgroundColor={currentTheme.background}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={[styles.heading, { color: currentTheme.textPrimary }]}>
              Choose your dates 📅
            </Text>

            {/* Date Range Summary Card */}
            <View style={styles.dateRangeSummaryCard}>
              {startDate && endDate ? (
                <>
                  <View style={styles.dateRangeDisplay}>
                    <View style={styles.dateBlock}>
                      <Text style={styles.dateLabel}>START</Text>
                      <Text style={styles.dateValue}>
                        {startDate.format("MMM DD")}
                      </Text>
                      <Text style={styles.yearValue}>
                        {startDate.format("YYYY")}
                      </Text>
                    </View>

                    <View style={styles.dateRangeDivider}>
                      <View style={styles.dividerLine} />
                      <View
                        style={[
                          styles.nightsContainer,
                          { backgroundColor: `${currentTheme.alternate}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.nightsCount,
                            { color: currentTheme.alternate },
                          ]}
                        >
                          {endDate.diff(startDate, "days")}
                        </Text>
                        <Text
                          style={[
                            styles.nightsLabel,
                            { color: currentTheme.alternate },
                          ]}
                        >
                          {endDate.diff(startDate, "days") === 1
                            ? "NIGHT"
                            : "NIGHTS"}
                        </Text>
                      </View>
                      <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.dateBlock}>
                      <Text style={styles.dateLabel}>END</Text>
                      <Text style={styles.dateValue}>
                        {endDate.format("MMM DD")}
                      </Text>
                      <Text style={styles.yearValue}>
                        {endDate.format("YYYY")}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.resetButton,
                      { backgroundColor: `${currentTheme.alternate}20` },
                    ]}
                    onPress={handleResetDates}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={18}
                      color={currentTheme.alternate}
                    />
                    <Text
                      style={[
                        styles.resetButtonText,
                        { color: currentTheme.alternate },
                      ]}
                    >
                      Reset
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emptyDateRange}>
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={currentTheme.alternate}
                  />
                  <Text style={styles.emptyDateRangeText}>
                    Select your travel dates
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.calendarContainer}>
            <CalendarPicker
              onDateChange={onDateChange}
              allowRangeSelection={true}
              minDate={new Date()}
              initialDate={startDate?.toDate() || new Date()}
              selectedStartDate={startDate?.toDate()}
              selectedEndDate={endDate?.toDate()}
              todayBackgroundColor="#F0F0F0"
              todayTextStyle={{ color: currentTheme.alternate }}
              selectedRangeStyle={{
                backgroundColor: `${currentTheme.alternate}30`,
              }}
              selectedDayStyle={{
                backgroundColor: currentTheme.alternate,
              }}
              selectedDayTextStyle={{
                color: "#FFFFFF",
                fontWeight: "600",
              }}
              textStyle={{
                color: "#000000",
                fontFamily: "outfit",
                fontSize: 14,
              }}
              dayLabels={["S", "M", "T", "W", "T", "F", "S"]}
              monthTitleStyle={{
                color: "#000000",
                fontSize: 16,
                fontWeight: "700",
                fontFamily: "outfit-bold",
              }}
              yearTitleStyle={{
                color: "#000000",
                fontSize: 16,
                fontWeight: "700",
                fontFamily: "outfit-bold",
              }}
              previousComponent={
                <Ionicons name="chevron-back" size={24} color="#505050" />
              }
              nextComponent={
                <Ionicons name="chevron-forward" size={24} color="#505050" />
              }
              disabledDatesTextStyle={{ color: "#CCCCCC" }}
              width={width - 48}
              scaleFactor={375}
              enableSwipe={true}
              restrictMonthNavigation={false}
              maxRangeDuration={365} // Allow up to 1 year range
              onStartDateSelected={(date: Date) => {
                console.log("Start date selected:", date);
              }}
              onEndDateSelected={(date: Date) => {
                console.log("End date selected:", date);
              }}
            />
          </View>

          <View style={styles.buttonContainer}>
            <MainButton
              buttonText={startDate && endDate ? "Continue" : "Select Dates"}
              onPress={handleDateSelectionContinue}
              width="100%"
              backgroundColor={currentTheme.alternate}
              disabled={!startDate || !endDate}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  headerContainer: {
    marginTop: 12,
    marginBottom: 24,
  },
  heading: {
    fontSize: 32,
    fontFamily: "outfit-bold",
    marginBottom: 20,
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
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    padding: 8,
    borderRadius: 8,
    alignSelf: "center",
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: "outfit-medium",
    marginLeft: 4,
  },
  emptyDateRange: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  emptyDateRangeText: {
    fontSize: 16,
    fontFamily: "outfit-medium",
    color: "#707070",
    marginLeft: 8,
  },
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
  buttonContainer: {
    marginTop: "auto",
    marginBottom: 24,
  },
});

export default ChooseDate;
