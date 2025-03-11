import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import React from "react";
import { useTheme } from "../../context/themeContext";

interface FlightData {
  airlineName: string;
  airlineUrl: string;
  flightPrice: number;
}

interface FlightInfoProps {
  flightData: FlightData;
}

const FlightInfo: React.FC<FlightInfoProps> = ({ flightData }) => {
  const { currentTheme } = useTheme();

  const handleBookClick = () => {
    if (flightData.airlineUrl) {
      Linking.openURL(flightData.airlineUrl);
      console.log(flightData.airlineUrl);
    } else {
      alert("Invalid url");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: currentTheme.textPrimary }]}>
          ✈️ Flights
        </Text>
        <Pressable
          onPress={handleBookClick}
          style={[
            styles.bookButton,
            { backgroundColor: currentTheme.alternate },
          ]}
        >
          <Text
            style={[styles.bookButtonText, { color: currentTheme.buttonText }]}
          >
            Book Here
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.infoText, { color: currentTheme.textSecondary }]}>
        Airline: {flightData.airlineName}
      </Text>
      <Text style={[styles.infoText, { color: currentTheme.textSecondary }]}>
        Price: ${flightData.flightPrice} (approx.)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
  },
  bookButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    width: 100,
    borderRadius: 25,
  },
  bookButtonText: {
    textAlign: "center",
  },
  infoText: {
    fontSize: 17,
    marginTop: 4,
  },
});

export default FlightInfo;
