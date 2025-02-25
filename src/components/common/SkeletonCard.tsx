import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "../../context/themeContext";
import { LinearGradient } from "expo-linear-gradient";

interface SkeletonCardProps {
  variant: "current" | "upcoming" | "past";
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ variant }) => {
  const { currentTheme } = useTheme();
  const shimmerValue = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, []);

  const translateX = shimmerValue.interpolate({
    inputRange: [-1, 1],
    outputRange: [-300, 300],
  });

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.8],
  });

  const getCardStyle = () => {
    switch (variant) {
      case "current":
        return styles.currentCard;
      case "upcoming":
        return styles.upcomingCard;
      case "past":
        return styles.pastCard;
      default:
        return {};
    }
  };

  return (
    <View
      style={[
        styles.container,
        getCardStyle(),
        { backgroundColor: currentTheme.accentBackground },
      ]}
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.shimmer,
            {
              transform: [{ translateX }],
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

      {variant === "past" ? (
        <View style={styles.pastContent}>
          <View
            style={[
              styles.pastImage,
              { backgroundColor: currentTheme.textSecondary + "20" },
            ]}
          />
          <View style={styles.pastTextContent}>
            <View
              style={[
                styles.titleBar,
                { backgroundColor: currentTheme.textSecondary + "20" },
              ]}
            />
            <View
              style={[
                styles.subtitleBar,
                { backgroundColor: currentTheme.textSecondary + "20" },
              ]}
            />
          </View>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.imageArea,
              { backgroundColor: currentTheme.textSecondary + "10" },
            ]}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <View
                style={[
                  styles.titleBar,
                  { backgroundColor: "rgba(255,255,255,0.3)" },
                ]}
              />
              <View
                style={[
                  styles.subtitleBar,
                  { backgroundColor: "rgba(255,255,255,0.3)" },
                ]}
              />
            </View>
          </LinearGradient>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    marginVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    backgroundColor: "#f8f8f8",
  },
  currentCard: {
    height: 240,
    width: "100%",
  },
  upcomingCard: {
    height: 200,
    width: 280,
    marginRight: 15,
  },
  pastCard: {
    height: 104,
    width: "100%",
    padding: 12,
  },
  shimmer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  imageArea: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    justifyContent: "flex-end",
    padding: 20,
  },
  content: {
    gap: 8,
  },
  pastContent: {
    flex: 1,
    flexDirection: "row",
    gap: 15,
  },
  pastImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  pastTextContent: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  titleBar: {
    height: 24,
    width: "70%",
    borderRadius: 6,
  },
  subtitleBar: {
    height: 16,
    width: "40%",
    borderRadius: 6,
  },
});

export default SkeletonCard;
