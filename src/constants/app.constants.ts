import { Platform } from "react-native";

export const APP_CONSTANTS = {
  STORAGE_KEYS: {
    HAS_LOGGED_IN: "hasLoggedInBefore",
    HAS_GENERATED_TRIPS: "hasGeneratedTrips",
    LAST_FETCH_TIME: "lastFetchTime",
  },
  TRIP_GENERATION: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 2000,
    TOTAL_TRIPS: 3,
  },
  API: {
    GOOGLE_PLACES: {
      MAX_WIDTH: 400,
      FIELDS: "photos",
      INPUT_TYPE: "textquery",
    },
  },
  UI: {
    ANIMATION: {
      SCALE: {
        PRESSED: 0.98,
        NORMAL: 1,
      },
      OPACITY: {
        PRESSED: 0.8,
        NORMAL: 1,
      },
    },
    SHADOW: Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  FONTS: {
    PRIMARY: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
} as const;

export const ERROR_MESSAGES = {
  USER_NOT_AUTHENTICATED: "User not authenticated",
  EMPTY_AI_RESPONSE: "Empty response from AI",
  INVALID_TRIP_STRUCTURE: "Invalid trip response structure",
  PARSE_ERROR: (attempts: number) =>
    `Failed to parse response after ${attempts} attempts`,
  GENERATE_ERROR:
    "Unable to generate valid trips. Please try again in a few moments.",
  LOAD_ERROR: "Failed to load trips",
} as const;

export const SUCCESS_MESSAGES = {
  PARTIAL_SUCCESS: (count: number) =>
    `Generated ${count} out of 3 trips successfully.`,
} as const;
