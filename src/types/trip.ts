export type TripStatus = "upcoming" | "current" | "past";

export interface TripData {
  startDate: string;
  endDate: string;
  [key: string]: any;
}

export interface TripPlan {
  [key: string]: any;
}

export interface Trip {
  id: string;
  docId: string;
  tripData: TripData;
  tripPlan: TripPlan;
  subcollection: string;
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
