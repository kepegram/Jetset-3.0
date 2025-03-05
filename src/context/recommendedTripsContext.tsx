import React, { createContext, useContext, useState } from "react";

// Types
export interface RecommendedTrip {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  photoRef?: string | null;
  tripPlan: any;
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

interface RecommendedTripsContextType {
  recommendedTripsState: RecommendedTripsState;
  setRecommendedTripsState: React.Dispatch<
    React.SetStateAction<RecommendedTripsState>
  >;
  loadingProgress: LoadingProgress;
  setLoadingProgress: React.Dispatch<React.SetStateAction<LoadingProgress>>;
}

const RecommendedTripsContext = createContext<
  RecommendedTripsContextType | undefined
>(undefined);

export const RecommendedTripsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [recommendedTripsState, setRecommendedTripsState] =
    useState<RecommendedTripsState>({
      trips: [],
      status: "idle",
      error: null,
      lastFetched: null,
    });

  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
    completed: 0,
    total: 3,
    currentTripIndex: 0,
    tripStatuses: ["waiting", "waiting", "waiting"],
  });

  return (
    <RecommendedTripsContext.Provider
      value={{
        recommendedTripsState,
        setRecommendedTripsState,
        loadingProgress,
        setLoadingProgress,
      }}
    >
      {children}
    </RecommendedTripsContext.Provider>
  );
};

export const useRecommendedTrips = () => {
  const context = useContext(RecommendedTripsContext);
  if (context === undefined) {
    throw new Error(
      "useRecommendedTrips must be used within a RecommendedTripsProvider"
    );
  }
  return context;
};
