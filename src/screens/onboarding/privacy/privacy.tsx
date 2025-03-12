import React from "react";
import { StyleSheet, ActivityIndicator, View, Pressable } from "react-native";
import WebView from "react-native-webview";
import { lightTheme } from "../../../theme/theme";
import { Ionicons } from "@expo/vector-icons";

interface PrivacyProps {
  onClose?: () => void;
}

const Privacy: React.FC<PrivacyProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <View style={styles.container}>
      {onClose && (
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={lightTheme.textPrimary} />
        </Pressable>
      )}
      <WebView
        source={{ uri: "https://download-jetset.app/privacy" }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightTheme.alternate} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: lightTheme.background,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 15,
    padding: 8,
  },
});

export default Privacy;
