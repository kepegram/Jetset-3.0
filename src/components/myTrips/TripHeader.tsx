import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Fontisto } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/appNav";

interface TripHeaderProps {
  displayName: string | null;
  userName: string | null;
  theme: any; // Replace with proper theme type
}

export const TripHeader: React.FC<TripHeaderProps> = ({
  displayName,
  userName,
  theme,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.background,
        },
      ]}
      accessibilityRole="header"
    >
      <View style={styles.headerContent}>
        <Text
          style={[styles.headerTitle, { color: theme.textPrimary }]}
          accessibilityRole="header"
          accessibilityLabel={`${displayName || userName || "My"} Trips`}
        >
          {displayName
            ? `${displayName.split(" ")[0]}'s`
            : userName
            ? `${userName.split(" ")[0]}'s`
            : "My"}{" "}
          Trips ✈️
        </Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.alternate }]}
          onPress={() => navigation.navigate("WhereTo")}
          accessibilityRole="button"
          accessibilityLabel="Add new trip"
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
  );
};

const styles = StyleSheet.create({
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
});
