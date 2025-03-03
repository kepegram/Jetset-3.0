import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Appearance } from "react-native";
import { FIREBASE_DB } from "../../firebase.config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { lightTheme, darkTheme } from "../theme/theme";

// Define the possible theme values
type Theme = "light" | "dark";

// Define the theme object structure
type ThemeObject = {
  background: string;
  primary: string;
  secondary: string;
  alternate: string;
  // Alternate variations
  alternateLight10: string;
  alternateLight15: string;
  alternateLight20: string;
  alternateLight30: string;
  alternateLight50: string;
  alternateLight90: string;
  // Secondary variations
  secondaryLight10: string;
  secondaryLight15: string;
  secondaryLight20: string;
  // Text Secondary variations
  textSecondaryLight20: string;
  // Error variations
  errorLight15: string;
  // Accent Background variations
  accentBackgroundLight80: string;
  // Original colors
  accentBackground: string;
  textPrimary: string;
  textSecondary: string;
  textMatch: string;
  buttonBackground: string;
  buttonText: string;
  inactive: string;
  icon: string;
  tabIcon: string;
  inactiveTabIcon: string;
  error: string;
  shadowBackground: string;
};

// Define the shape of our theme context
type ThemeContextType = {
  theme: Theme; // Current theme mode
  currentTheme: ThemeObject; // Theme object containing colors and styles
  setTheme: (newTheme: Theme) => void; // Function to update theme
};

type ThemeProviderProps = {
  children: ReactNode; // Type for React children components
};

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: Appearance.getColorScheme() as Theme,
  currentTheme: Appearance.getColorScheme() === "dark" ? darkTheme : lightTheme,
  setTheme: () => {},
});

// ThemeProvider component that manages theme state and provides it to children
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme state based on system appearance
  const [theme, setTheme] = useState<Theme>(
    Appearance.getColorScheme() as Theme
  );
  const auth = getAuth();
  const user = auth.currentUser;

  // Get the appropriate theme object based on current theme mode
  const currentTheme = theme === "dark" ? darkTheme : lightTheme;

  // Fetch user's theme preference from Firestore
  const fetchUserTheme = async () => {
    if (user) {
      const userDocRef = doc(FIREBASE_DB, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        return userData.theme;
      }
    }
    return null;
  };

  // Save user's theme preference to Firestore
  const saveThemeToFirestore = async (newTheme: Theme) => {
    if (user) {
      const userDocRef = doc(FIREBASE_DB, "users", user.uid);
      await setDoc(userDocRef, { theme: newTheme }, { merge: true });
    }
  };

  useEffect(() => {
    // Load theme preference on component mount
    const loadTheme = async () => {
      const storedTheme = await fetchUserTheme();
      if (storedTheme) {
        setTheme(storedTheme as Theme);
      } else {
        setTheme(Appearance.getColorScheme() as Theme);
      }
    };

    loadTheme();

    // Listen for system theme changes
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme as Theme);
    });

    // Cleanup listener on component unmount
    return () => listener.remove();
  }, []);

  // Handler for theme changes - updates state and saves to Firestore
  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    saveThemeToFirestore(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        currentTheme,
        setTheme: handleSetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for accessing theme context
export const useTheme = () => useContext(ThemeContext);
