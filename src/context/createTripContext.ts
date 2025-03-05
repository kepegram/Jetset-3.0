import { createContext, useContext } from "react";
import { SelectionOption } from "../screens/main/tripScreens/buildTrip/moreInfo";

export interface Location {
  name: string;
  placeId: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface LocationInfo {
  formatted_address?: string;
  name: string;
  place_id: string;
  types?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  photoRef?: string;
  url?: string;
}

export interface TripParticipant {
  count: number;
  type: string;
}

export interface TripData {
  destination?: Location;
  locationInfo?: LocationInfo;
  startDate?: Date;
  endDate?: Date;
  participants?: TripParticipant[];
  whoIsGoing?: string | TripParticipant[]; // Can be either string or array of participants
  activityLevel?: string;
  budget?: string;
  preferences?: {
    [key: string]: boolean | string;
  };
  generatedItinerary?: any;
  totalNoOfDays?: number;
  destinationType?: string;
  preSelectedDestination?: string;
}

interface TripContextType {
  tripData: TripData;
  setTripData: React.Dispatch<React.SetStateAction<TripData>>;
}

export const CreateTripContext = createContext<TripContextType | null>(null);

export const useTrip = () => {
  const context = useContext(CreateTripContext);
  if (!context) {
    throw new Error("useTrip must be used within a CreateTripContext.Provider");
  }
  return context;
};
