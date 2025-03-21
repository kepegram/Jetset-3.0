import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  Platform,
} from "react-native";
import { useTheme } from "../../context/themeContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface RecommendedTripSkeletonProps {
  status: "waiting" | "loading" | "completed" | "error";
  currentlyGenerating?: boolean;
  tripNumber: number;
  loadingProgress?: number;
  isFirstCard?: boolean;
}

const RecommendedTripSkeleton: React.FC<RecommendedTripSkeletonProps> = ({
  status = "waiting",
  currentlyGenerating = false,
  tripNumber,
  loadingProgress = 0,
  isFirstCard = false,
}) => {
  const { currentTheme } = useTheme();
  const shimmerValue = useRef(new Animated.Value(-1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    if (currentlyGenerating) {
      pulseAnimation.start();
    } else {
      pulseAnimation.stop();
    }

    if (status === "loading" || status === "waiting") {
      shimmerAnimation.start();
    } else {
      shimmerAnimation.stop();
    }

    return () => {
      shimmerAnimation.stop();
      pulseAnimation.stop();
    };
  }, [currentlyGenerating, status]);

  const translateX = shimmerValue.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  });

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "error":
        return "#F44336";
      case "loading":
        return "#2196F3";
      default:
        return currentTheme.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "completed":
        return "Trip generated!";
      case "error":
        return "Error generating trip";
      case "loading":
        return "Generating trip...";
      default:
        return "Waiting...";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      case "loading":
        return "refresh-circle";
      default:
        return "time";
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: currentlyGenerating ? pulseValue : 1 }] },
      ]}
    >
      <View style={styles.statusHeader}>
        <Text
          style={[styles.tripNumberText, { color: currentTheme.textSecondary }]}
        >
          Trip {tripNumber}
        </Text>
        <View style={styles.statusContainer}>
          <Ionicons
            name={getStatusIcon()}
            size={16}
            color={getStatusColor()}
            style={[
              styles.statusIcon,
              status === "loading" && styles.spinningIcon,
            ]}
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.tripCard,
          { backgroundColor: currentTheme.shadowBackground },
          status === "completed" && styles.completedCard,
          status === "error" && styles.errorCard,
        ]}
      >
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.shimmer,
              {
                transform: [{ translateX }],
                opacity: status === "loading" ? 1 : 0,
              },
            ]}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.15)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>

        <View
          style={[
            styles.imageArea,
            { backgroundColor: currentTheme.textSecondary + "10" },
          ]}
        />
        <View style={styles.infoContainer}>
          <View
            style={[
              styles.locationIcon,
              { backgroundColor: currentTheme.textSecondary + "20" },
            ]}
          />
          <View style={styles.textContainer}>
            <View
              style={[
                styles.titleBar,
                { backgroundColor: currentTheme.textSecondary + "20" },
              ]}
            />
            <View
              style={[
                styles.descriptionBar,
                { backgroundColor: currentTheme.textSecondary + "20" },
              ]}
            />
            <View
              style={[
                styles.descriptionBar,
                {
                  width: "60%",
                  backgroundColor: currentTheme.textSecondary + "20",
                },
              ]}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginRight: 20,
  },
  statusHeader: {
    alignItems: "center",
    marginBottom: 10,
    width: width * 0.6,
  },
  tripNumberText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
  },
  spinningIcon: {
    transform: [{ rotate: "45deg" }],
  },
  tripCard: {
    borderRadius: 15,
    width: width * 0.6,
    height: width * 0.75,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shimmer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  imageArea: {
    width: "100%",
    height: width * 0.55,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 15,
    gap: 8,
  },
  locationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: 3,
  },
  textContainer: {
    flex: 1,
    gap: 8,
  },
  titleBar: {
    height: 20,
    width: "80%",
    borderRadius: 4,
  },
  descriptionBar: {
    height: 14,
    width: "90%",
    borderRadius: 4,
  },
  completedCard: {
    opacity: 0.8,
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  errorCard: {
    opacity: 0.8,
    borderColor: "#F44336",
    borderWidth: 2,
  },
});

export default RecommendedTripSkeleton;
