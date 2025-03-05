import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ScrollView,
} from "react-native";
import React, { useContext, useState } from "react";
import { RootStackParamList } from "../../../../navigation/appNav";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../../context/themeContext";
import { MainButton } from "../../../../components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import { useTrip } from "../../../../context/createTripContext";

type MoreInfoNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MoreInfo"
>;

export interface SelectionOption {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}

export const activityOptions: SelectionOption[] = [
  {
    label: "Take it easy",
    description: "Relaxed pace with plenty of downtime",
    icon: "leaf-outline",
    value: "Low",
  },
  {
    label: "Balanced mix",
    description: "Good blend of activities and rest",
    icon: "walk-outline",
    value: "Normal",
  },
  {
    label: "Adventure packed",
    description: "Full days with lots of activities",
    icon: "bicycle-outline",
    value: "High",
  },
];

export const budgetOptions: SelectionOption[] = [
  {
    label: "Budget friendly",
    description: "Economic options and good deals",
    icon: "wallet-outline",
    value: "Frugal",
  },
  {
    label: "Mid-range",
    description: "Mix of comfort and value",
    icon: "card-outline",
    value: "Average",
  },
  {
    label: "High-end",
    description: "Premium experiences and luxury stays",
    icon: "diamond-outline",
    value: "Luxury",
  },
];

const MoreInfo: React.FC = () => {
  const navigation = useNavigation<MoreInfoNavigationProp>();
  const { currentTheme } = useTheme();
  const { tripData, setTripData } = useTrip();
  const [activityLevel, setActivityLevel] = useState<string>("");
  const [budget, setBudget] = useState<string>("");

  // Reusable button component for selection options
  const SelectionButton = ({
    selected,
    onPress,
    label,
    icon,
    description,
  }: {
    selected: boolean;
    onPress: () => void;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectionButton,
        {
          backgroundColor: currentTheme.background,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          borderColor: selected
            ? currentTheme.alternate
            : currentTheme.secondary,
        },
      ]}
    >
      <View style={styles.selectionContent}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: selected
                ? currentTheme.alternate
                : currentTheme.background,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={24}
            color={selected ? "white" : currentTheme.textSecondary}
          />
        </View>
        <View style={styles.selectionTextContainer}>
          <Text
            style={[
              styles.selectionTitle,
              {
                color: currentTheme.textPrimary,
                fontWeight: selected ? "600" : "400",
              },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.selectionDescription,
              { color: currentTheme.textSecondary },
            ]}
          >
            {description}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.heading, { color: currentTheme.textPrimary }]}>
            Trip Preferences ⚙️
          </Text>
          <Text
            style={[styles.subheading, { color: currentTheme.textSecondary }]}
          >
            Help us further customize your perfect itinerary!
          </Text>
        </View>

        <View style={styles.selectionsContainer}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="walk-outline"
                size={24}
                color={currentTheme.alternate}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: currentTheme.textPrimary },
                ]}
              >
                Activity Level
              </Text>
            </View>
            <View style={styles.optionsContainer}>
              <SelectionButton
                selected={activityLevel === "Low"}
                onPress={() => setActivityLevel("Low")}
                label="Take it easy"
                description="Relaxed pace with plenty of downtime"
                icon="leaf-outline"
              />
              <SelectionButton
                selected={activityLevel === "Normal"}
                onPress={() => setActivityLevel("Normal")}
                label="Balanced mix"
                description="Good blend of activities and rest"
                icon="walk-outline"
              />
              <SelectionButton
                selected={activityLevel === "High"}
                onPress={() => setActivityLevel("High")}
                label="Adventure packed"
                description="Full days with lots of activities"
                icon="bicycle-outline"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="wallet-outline"
                size={24}
                color={currentTheme.alternate}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: currentTheme.textPrimary },
                ]}
              >
                Budget Range
              </Text>
            </View>
            <View style={styles.optionsContainer}>
              <SelectionButton
                selected={budget === "Frugal"}
                onPress={() => setBudget("Frugal")}
                label="Budget friendly"
                description="Economic options and good deals"
                icon="wallet-outline"
              />
              <SelectionButton
                selected={budget === "Average"}
                onPress={() => setBudget("Average")}
                label="Mid-range"
                description="Mix of comfort and value"
                icon="card-outline"
              />
              <SelectionButton
                selected={budget === "Luxury"}
                onPress={() => setBudget("Luxury")}
                label="High-end"
                description="Premium experiences and luxury stays"
                icon="diamond-outline"
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <MainButton
            onPress={() => {
              setTripData({
                ...tripData,
                activityLevel,
                budget,
              });
              navigation.navigate("ReviewTrip");
            }}
            buttonText="Continue"
            width="85%"
            backgroundColor={currentTheme.alternate}
            disabled={!activityLevel || !budget}
          />
        </View>
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
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 32,
  },
  heading: {
    fontSize: 32,
    fontFamily: "outfit-bold",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    fontFamily: "outfit",
    opacity: 0.8,
  },
  selectionsContainer: {
    gap: 32,
    marginBottom: 20,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "outfit-medium",
  },
  optionsContainer: {
    gap: 12,
  },
  selectionButton: {
    padding: 16,
    borderRadius: 16,
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
  selectionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectionTextContainer: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: 16,
    fontFamily: "outfit-medium",
    marginBottom: 4,
  },
  selectionDescription: {
    fontSize: 14,
    fontFamily: "outfit",
    opacity: 0.7,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
});

export default MoreInfo;
