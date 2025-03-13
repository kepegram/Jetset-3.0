import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  Pressable,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { RootStackParamList } from "../../../../navigation/appNav";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { useTrip } from "../../../../context/createTripContext";
import { useTheme } from "../../../../context/themeContext";
import { MainButton } from "../../../../components/ui/button";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

type WhosGoingNavigationProp = StackNavigationProp<
  RootStackParamList,
  "WhosGoing"
>;

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

const WhosGoing: React.FC = () => {
  const navigation = useNavigation<WhosGoingNavigationProp>();
  const { currentTheme } = useTheme();
  const { tripData, setTripData } = useTrip();
  const [whoIsGoing, setWhoIsGoing] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "",
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    setTripData({
      ...tripData,
      whoIsGoing: "Solo",
    });
  }, [navigation]);

  const handleOptionSelect = (value: number) => {
    setWhoIsGoing(value);
    const option = travelOptions.find((opt) => opt.value === value);
    setTripData({
      ...tripData,
      whoIsGoing: option?.label,
    });
  };

  const renderOption = (option: (typeof travelOptions)[0]) => (
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
              whoIsGoing === option.value ? "white" : currentTheme.textSecondary
            }
          />
        </View>
        <View style={styles.optionTextContainer}>
          <Text
            style={[
              styles.optionTitle,
              {
                color: currentTheme.textPrimary,
                fontWeight: whoIsGoing === option.value ? "600" : "400",
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
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.heading, { color: currentTheme.textPrimary }]}>
            Travel Companions 👥
          </Text>
          <Text
            style={[styles.subheading, { color: currentTheme.textSecondary }]}
          >
            Who's joining your adventure?
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {travelOptions.map(renderOption)}
        </View>

        <View style={styles.footer}>
          <MainButton
            onPress={() => navigation.navigate("MoreInfo")}
            buttonText="Continue"
            width="85%"
            backgroundColor={currentTheme.alternate}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    marginTop: 20,
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
  optionsContainer: {
    flex: 1,
    gap: 16,
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
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default WhosGoing;
