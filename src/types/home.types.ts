import { GooglePlaceDetail } from "react-native-google-places-autocomplete";
import { Theme, ThemeObject } from "../context/themeContext";

export interface UserPreferences {
  hasCompletedOnboarding: boolean;
  lastTripsGeneration: string | null;
  hasGeneratedTrips: boolean;
}

export interface ExtendedGooglePlaceDetail extends GooglePlaceDetail {
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
    html_attributions: string[];
  }>;
}

export interface RecommendedTrip {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  photoRef?: string | null;
  tripPlan: any; // TODO: Define proper type for trip plan
}

export interface AIError extends Error {
  message: string;
  status?: number;
}

export interface LoadingProgress {
  completed: number;
  total: number;
  currentTripIndex: number;
  tripStatuses: Array<"waiting" | "loading" | "completed" | "error">;
}

export interface RecommendedTripsState {
  trips: RecommendedTrip[];
  status: "idle" | "loading" | "error" | "success";
  error: string | null;
  lastFetched: Date | null;
}

export interface EmptyTripsStateProps {
  onRetry: () => void;
  theme: ThemeObject;
}

export interface ErrorTripsStateProps {
  onRetry: () => void;
  theme: ThemeObject;
  error?: string;
}

export interface HomeScreenProps {
  navigation: any; // TODO: Define proper navigation type
}
