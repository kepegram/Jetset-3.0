import React, { useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../../../context/themeContext";
import { CreateTripContext } from "../../../../../context/createTripContext";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../../../../../firebase.config";
import { doc, setDoc, collection } from "firebase/firestore";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import CalendarPicker from "react-native-calendar-picker";
import moment, { Moment } from "moment";
import { RootStackParamList } from "../../../../../navigation/appNav";

type ManualTripBuilderNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ManualTripBuilder"
>;

const ManualTripBuilder: React.FC = () => {
  const navigation = useNavigation<ManualTripBuilderNavigationProp>();
  const { currentTheme } = useTheme();
  const tripContext = useContext(CreateTripContext);
  const tripData = tripContext?.tripData || {};
  const [loading, setLoading] = useState(false);

  const sections = [
    {
      id: "destination",
      icon: (
        <MaterialIcons name="place" size={24} color={currentTheme.alternate} />
      ),
      title: "Destination",
      placeholder: "Where are you heading?",
    },
    {
      id: "accommodation",
      icon: (
        <FontAwesome5 name="hotel" size={20} color={currentTheme.alternate} />
      ),
      title: "Accommodation",
      placeholder: "Where will you stay?",
      multiline: true,
    },
    {
      id: "transportation",
      icon: (
        <MaterialIcons
          name="directions-car"
          size={24}
          color={currentTheme.alternate}
        />
      ),
      title: "Transportation",
      placeholder: "How will you get around?",
      multiline: true,
    },
    {
      id: "notes",
      icon: (
        <MaterialIcons name="note" size={24} color={currentTheme.alternate} />
      ),
      title: "Additional Notes",
      placeholder: "Any other details to remember...",
      multiline: true,
    },
  ];

  const [tripDetails, setTripDetails] = useState({
    destination: "",
    activities: [""],
    accommodation: "",
    transportation: "",
    notes: "",
  });

  const [startDate, setStartDate] = useState<Moment | null>(null);
  const [endDate, setEndDate] = useState<Moment | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerShown: true,
        headerTransparent: true,
        headerTitle: "",
        headerStyle: {
          backgroundColor: "transparent",
        },
      });
    }, [navigation])
  );

  const onDateChange = useCallback(
    (date: Date, type: string) => {
      if (!date) return;
      const momentDate = moment(date);
      if (type === "START_DATE") {
        setStartDate(momentDate);
        if (endDate && endDate.isBefore(momentDate)) {
          setEndDate(null);
        }
      } else {
        if (startDate && momentDate.isBefore(startDate)) {
          return;
        }
        setEndDate(momentDate);
      }
    },
    [startDate, endDate]
  );

  const getDateRangeText = useCallback(() => {
    if (startDate && endDate) {
      const nights = endDate.diff(startDate, "days");
      return `${startDate.format("MMM D")} - ${endDate.format(
        "MMM D, YYYY"
      )} • ${nights} ${nights === 1 ? "night" : "nights"}`;
    }
    return "Select your travel dates";
  }, [startDate, endDate]);

  const handleAddActivity = () => {
    setTripDetails((prev) => ({
      ...prev,
      activities: [...prev.activities, ""],
    }));
  };

  const handleActivityChange = (text: string, index: number) => {
    const newActivities = [...tripDetails.activities];
    newActivities[index] = text;
    setTripDetails((prev) => ({
      ...prev,
      activities: newActivities,
    }));
  };

  const handleRemoveActivity = (index: number) => {
    const newActivities = tripDetails.activities.filter((_, i) => i !== index);
    setTripDetails((prev) => ({
      ...prev,
      activities: newActivities,
    }));
  };

  const handleSaveTrip = async () => {
    if (!tripDetails.destination) {
      Alert.alert("Error", "Please enter a destination");
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert("Error", "Please select both start and end dates");
      return;
    }

    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to save a trip");
      return;
    }

    setLoading(true);
    try {
      const docId = Date.now().toString();
      const today = moment().startOf("day");

      // Determine which subcollection to save to
      let subcollectionPath;
      if (startDate.isAfter(today)) {
        subcollectionPath = "upcomingTrips";
      } else if (endDate.isBefore(today)) {
        subcollectionPath = "pastTrips";
      } else {
        subcollectionPath = "currentTrips";
      }

      // First, create a reference to the userTrips collection
      const userTripsCollectionRef = collection(
        FIREBASE_DB,
        `users/${user.uid}/userTrips`
      );

      // Then, create a reference to the specific subcollection
      const subcollectionRef = collection(
        userTripsCollectionRef,
        subcollectionPath
      );

      // Finally, create a document reference in the subcollection
      const tripDocRef = doc(subcollectionRef, docId);

      const tripPlan = {
        travelPlan: {
          destination: tripDetails.destination,
          dailyActivities: tripDetails.activities.filter((activity) =>
            activity.trim()
          ),
          accommodation: tripDetails.accommodation,
          transportation: tripDetails.transportation,
          notes: tripDetails.notes,
        },
      };

      const sanitizedTripData = {
        ...tripData,
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
        totalNoOfDays: endDate.diff(startDate, "days") + 1,
      };

      await setDoc(tripDocRef, {
        userEmail: user.email || "unknown",
        tripPlan,
        tripData: sanitizedTripData,
        docId,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Trip saved successfully!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("MyTripsMain"),
        },
      ]);
    } catch (error) {
      console.error("Error saving trip:", error);
      Alert.alert("Error", "Failed to save trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (section: {
    id: string;
    icon: JSX.Element;
    title: string;
    placeholder: string;
    multiline?: boolean;
  }) => (
    <View key={section.id} style={styles.section}>
      <View style={styles.sectionHeader}>
        {section.icon}
        <Text
          style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}
        >
          {section.title}
        </Text>
      </View>
      <View
        style={[
          styles.inputWrapper,
          { backgroundColor: `${currentTheme.secondary}15` },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            section.multiline && styles.multilineInput,
            { color: currentTheme.textPrimary },
          ]}
          value={String(tripDetails[section.id as keyof typeof tripDetails])}
          onChangeText={(text) =>
            setTripDetails((prev) => ({ ...prev, [section.id]: text }))
          }
          placeholder={section.placeholder}
          placeholderTextColor={currentTheme.textSecondary}
          multiline={section.multiline}
        />
      </View>
    </View>
  );

  const renderDateSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons
          name="date-range"
          size={24}
          color={currentTheme.alternate}
        />
        <Text
          style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}
        >
          Travel Dates
        </Text>
      </View>
      <Pressable
        onPress={() => setShowCalendar(!showCalendar)}
        style={[
          styles.dateButton,
          { backgroundColor: `${currentTheme.secondary}15` },
        ]}
      >
        <Text style={[styles.dateText, { color: currentTheme.textPrimary }]}>
          {getDateRangeText()}
        </Text>
        <Ionicons
          name={showCalendar ? "chevron-up" : "chevron-down"}
          size={24}
          color={currentTheme.textPrimary}
        />
      </Pressable>
      {showCalendar && (
        <View
          style={[
            styles.calendarWrapper,
            { backgroundColor: `${currentTheme.secondary}10` },
          ]}
        >
          <CalendarPicker
            onDateChange={onDateChange}
            allowRangeSelection={true}
            minDate={new Date()}
            selectedStartDate={startDate?.toDate()}
            selectedEndDate={endDate?.toDate()}
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
            todayBackgroundColor={`${currentTheme.alternate}30`}
            width={Dimensions.get("window").width - 48}
          />
        </View>
      )}
    </View>
  );

  const renderActivitiesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="event" size={24} color={currentTheme.alternate} />
        <Text
          style={[styles.sectionTitle, { color: currentTheme.textPrimary }]}
        >
          Activities
        </Text>
      </View>
      {tripDetails.activities.map((activity, index) => (
        <View key={index} style={styles.activityContainer}>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: `${currentTheme.secondary}15`, flex: 1 },
            ]}
          >
            <TextInput
              style={[styles.input, { color: currentTheme.textPrimary }]}
              value={activity}
              onChangeText={(text) => handleActivityChange(text, index)}
              placeholder={`Activity ${index + 1}`}
              placeholderTextColor={currentTheme.textSecondary}
            />
          </View>
          {tripDetails.activities.length > 1 && (
            <Pressable
              style={styles.removeButton}
              onPress={() => handleRemoveActivity(index)}
            >
              <MaterialIcons
                name="remove-circle"
                size={24}
                color={currentTheme.error}
              />
            </Pressable>
          )}
        </View>
      ))}
      <Pressable
        style={[
          styles.addButton,
          { backgroundColor: `${currentTheme.alternate}20` },
        ]}
        onPress={handleAddActivity}
      >
        <MaterialIcons name="add" size={24} color={currentTheme.alternate} />
        <Text style={[styles.addButtonText, { color: currentTheme.alternate }]}>
          Add Activity
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: currentTheme.textPrimary }]}>
            Plan Your Journey ✈️
          </Text>
          <Text
            style={[styles.subtitle, { color: currentTheme.textSecondary }]}
          >
            Let's create your perfect itinerary
          </Text>
        </View>

        {renderSection(sections[0])}
        {renderDateSection()}
        {renderActivitiesSection()}
        {sections.slice(1).map(renderSection)}

        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: currentTheme.alternate },
            loading && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveTrip}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialIcons name="save" size={24} color="white" />
              <Text style={styles.saveButtonText}>Save Trip</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: "outfit-bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "outfit",
    opacity: 0.8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "outfit-medium",
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  input: {
    padding: 16,
    fontSize: 16,
    fontFamily: "outfit",
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 16,
    fontFamily: "outfit",
  },
  calendarWrapper: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  activityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  removeButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: "outfit-medium",
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "outfit-medium",
  },
});

export default ManualTripBuilder;
