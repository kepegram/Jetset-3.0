export const TRIPS_CONSTANTS = {
  ITEMS_TO_SHOW: 6,
  ANIMATION_CONFIG: {
    SCALE: {
      toValue: 0.98,
      useNativeDriver: true,
    },
    RESET: {
      toValue: 1,
      useNativeDriver: true,
    },
  },
  ERROR_MESSAGES: {
    FETCH_ERROR: "Failed to fetch trips. Please try again.",
    USER_ERROR: "Failed to fetch user information.",
    NETWORK_ERROR: "Network error. Please check your connection.",
  },
  SUBCOLLECTIONS: {
    UPCOMING: "upcoming",
    CURRENT: "current",
    PAST: "past",
  },
  ACCESSIBILITY: {
    HEADER: "Trips header",
    ADD_BUTTON: "Add new trip",
    NO_TRIPS: "No trips available",
    LOADING: "Loading trips",
  },
} as const;
