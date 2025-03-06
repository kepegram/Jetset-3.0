import React from "react";
import {
  Text,
  Pressable,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
  DimensionValue,
  StyleProp,
  View,
  PressableProps,
} from "react-native";
import { useTheme } from "../../context/themeContext";

type ButtonProps = {
  testID?: string;
  buttonText?: string;
  onPress: (event: GestureResponderEvent) => void;
  width?: number | string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  disabled?: boolean;
  textColor?: string;
  rightIcon?: React.ReactNode;
  activeOpacity?: number;
} & Omit<PressableProps, "onPress">;

const CustomButton: React.FC<ButtonProps> = ({
  buttonText,
  onPress,
  children,
  disabled,
}) => {
  const { currentTheme } = useTheme();

  return (
    <Pressable
      style={[
        styles.button,
        { borderColor: currentTheme.primary, opacity: disabled ? 0.5 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {children ? (
        children
      ) : (
        <Text style={[styles.buttonText, { color: currentTheme.textPrimary }]}>
          {buttonText}
        </Text>
      )}
    </Pressable>
  );
};

const AltButton: React.FC<ButtonProps> = ({ buttonText, onPress }) => {
  const { currentTheme } = useTheme();

  return (
    <Pressable
      style={[
        styles.altButton,
        { backgroundColor: currentTheme.buttonBackground },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.altButtonText, { color: currentTheme.buttonText }]}>
        {buttonText}
      </Text>
    </Pressable>
  );
};

const MainButton: React.FC<ButtonProps> = ({
  testID,
  buttonText,
  onPress,
  width,
  backgroundColor,
  style,
  children,
  disabled,
  textColor,
  rightIcon,
  activeOpacity,
  ...pressableProps
}) => {
  const { currentTheme } = useTheme();

  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [
        styles.mainButton,
        {
          backgroundColor: backgroundColor || currentTheme.alternate,
          width: (width as DimensionValue) || 120,
          opacity: disabled ? 0.5 : pressed ? activeOpacity || 0.8 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      {...pressableProps}
    >
      {children ? (
        children
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={[
              styles.mainButtonText,
              { color: textColor || currentTheme.buttonText },
            ]}
          >
            {buttonText}
          </Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: 120,
    alignItems: "center",
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  altButton: {
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: 120,
    alignItems: "center",
  },
  altButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  mainButton: {
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export { CustomButton, AltButton, MainButton };
