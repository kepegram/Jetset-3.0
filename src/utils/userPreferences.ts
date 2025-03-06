import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { FIREBASE_DB } from "../../firebase.config";
import { UserPreferences } from "../types/home.types";

const PREFERENCES_KEY = "userPreferences";

export const getUserPreferences = async (
  userId: string
): Promise<UserPreferences> => {
  try {
    // Try to get preferences from AsyncStorage first
    const localPrefs = await AsyncStorage.getItem(PREFERENCES_KEY);
    let preferences: UserPreferences;

    if (localPrefs) {
      preferences = JSON.parse(localPrefs);
    } else {
      // If not in AsyncStorage, try to get from Firestore
      const userDoc = await getDoc(
        doc(FIREBASE_DB, `users/${userId}/preferences/general`)
      );

      if (userDoc.exists()) {
        preferences = userDoc.data() as UserPreferences;
      } else {
        // If no preferences exist anywhere, create default preferences
        preferences = {
          hasCompletedOnboarding: false,
          lastTripsGeneration: null,
          hasGeneratedTrips: false,
        };
      }

      // Save to AsyncStorage for future quick access
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    }

    return preferences;
  } catch (error) {
    console.error("Error getting user preferences:", error);
    // Return default preferences if there's an error
    return {
      hasCompletedOnboarding: false,
      lastTripsGeneration: null,
      hasGeneratedTrips: false,
    };
  }
};

export const updateUserPreferences = async (
  userId: string,
  updates: Partial<UserPreferences>
): Promise<void> => {
  try {
    // Get current preferences
    const currentPrefs = await getUserPreferences(userId);
    const newPrefs = { ...currentPrefs, ...updates };

    // Update both AsyncStorage and Firestore
    await Promise.all([
      AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPrefs)),
      setDoc(
        doc(FIREBASE_DB, `users/${userId}/preferences/general`),
        newPrefs,
        { merge: true }
      ),
    ]);
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
};

export const clearUserPreferences = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PREFERENCES_KEY);
  } catch (error) {
    console.error("Error clearing user preferences:", error);
    throw error;
  }
};
