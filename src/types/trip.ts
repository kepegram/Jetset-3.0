export type TripStatus = "upcoming" | "current" | "past";

export interface TripData {
  startDate: string;
  endDate: string;
  // Add other trip data fields as needed
  [key: string]: any; // Allow for additional fields
}

export interface TripPlan {
  // Add trip plan fields as needed
  [key: string]: any; // Allow for additional fields
}

export interface Trip {
  id: string;
  docId: string;
  tripData: TripData;
  tripPlan: TripPlan;
  subcollection: string; // Changed from TripStatus to string to match existing code
}

export interface TripState {
  userTrips: Trip[] | null;
  isLoading: boolean;
  error: string | null;
}

export interface TripCardProps {
  trip: {
    tripData: TripData;
    tripPlan: TripPlan;
    id: string;
  };
}
