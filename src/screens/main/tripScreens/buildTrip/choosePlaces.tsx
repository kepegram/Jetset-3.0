import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import React, { useState, useContext, useRef, useCallback } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../../navigation/appNav";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../../../context/themeContext";
import { MainButton } from "../../../../components/ui/button";
import { CreateTripContext } from "../../../../context/createTripContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

type ChoosePlacesNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ChoosePlaces"
>;

const { width, height } = Dimensions.get("window");

const ChoosePlaces: React.FC = () => {
  const navigation = useNavigation<ChoosePlacesNavigationProp>();
  const { currentTheme } = useTheme();
  const { tripData = {}, setTripData = () => {} } =
    useContext(CreateTripContext) || {};
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    null
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const destinations = [
    {
      id: "beach",
      image: require("../../../../assets/build-trip-imgs/beach.jpeg"),
      label: "Beach Paradise",
      icon: "beach-access",
      description: "Pristine shores & crystal waters",
    },
    {
      id: "mountain",
      image: require("../../../../assets/build-trip-imgs/mountain.jpg"),
      label: "Mountain Escape",
      icon: "landscape",
      description: "Majestic peaks & scenic trails",
    },
    {
      id: "islands",
      image: require("../../../../assets/build-trip-imgs/island.jpg"),
      label: "Tropical Islands",
      icon: "waves",
      description: "Secluded paradise getaways",
    },
    {
      id: "landmarks",
      image: require("../../../../assets/build-trip-imgs/landmark.jpg"),
      label: "Historic Landmarks",
      icon: "location-city",
      description: "Iconic monuments & wonders",
    },
  ];

  useFocusEffect(
    useCallback(() => {
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
    }, [])
  );

  const handleContinue = () => {
    if (selectedDestination) {
      const selectedPlace = destinations.find(
        (dest) => dest.id === selectedDestination
      );

      setTripData({
        ...tripData,
        destinationType: selectedPlace?.label,
        locationInfo: {
          name: `${selectedPlace?.label}`,
        },
      });
      navigation.navigate("ChooseDate");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: currentTheme.background }]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.heading, { color: currentTheme.textPrimary }]}>
            Dream Destination ✨
          </Text>
          <Text
            style={[styles.subheading, { color: currentTheme.textSecondary }]}
          >
            What type of adventure calls to you?
          </Text>
        </View>

        <View style={styles.grid}>
          {destinations.map((destination) => (
            <Pressable
              key={destination.id}
              onPress={() => setSelectedDestination(destination.id)}
              style={({ pressed }) => [
                styles.destinationCard,
                {
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Image
                source={destination.image}
                style={[
                  styles.destinationImage,
                  {
                    opacity: selectedDestination === destination.id ? 1 : 0.7,
                  },
                ]}
              />
              <View
                style={[
                  styles.overlay,
                  {
                    backgroundColor:
                      selectedDestination === destination.id
                        ? currentTheme.alternateLight90
                        : "rgba(0,0,0,0.5)",
                  },
                ]}
              >
                <MaterialIcons
                  name={destination.icon as any}
                  size={28}
                  color="white"
                />
                <Text style={styles.cardTitle}>{destination.label}</Text>
                <Text style={styles.cardDescription}>
                  {destination.description}
                </Text>
                {selectedDestination === destination.id && (
                  <View style={styles.selectedIndicator}>
                    <MaterialIcons
                      name="check-circle"
                      size={24}
                      color="white"
                    />
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <MainButton
            onPress={handleContinue}
            buttonText="Continue"
            width="85%"
            backgroundColor={currentTheme.alternate}
            disabled={!selectedDestination}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 30,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 15,
  },
  destinationCard: {
    width: (width - 55) / 2,
    height: (height - 300) / 2,
    borderRadius: 20,
    overflow: "hidden",
  },
  destinationImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  cardTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "outfit-bold",
    textAlign: "center",
    marginTop: 8,
  },
  cardDescription: {
    color: "white",
    fontSize: 12,
    fontFamily: "outfit",
    textAlign: "center",
    opacity: 0.9,
    marginTop: 4,
  },
  selectedIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  footer: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});

export default ChoosePlaces;
