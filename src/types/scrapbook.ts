export type TimestampString = string;

export interface TripModel {
  id: string;
  name: string;
  destination: string;
  startDate: TimestampString;
  endDate: TimestampString;
  coverPhotoUri?: string | null;
  createdAt: TimestampString;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ExcursionModel {
  id: string;
  tripId: string;
  title: string;
  description?: string;
  photoUris: string[];
  createdAt: TimestampString;
}

export interface ScrapbookState {
  trips: TripModel[];
  excursionsByTripId: Record<string, ExcursionModel[]>;
  lastSyncedAt?: TimestampString;
}

export type CreateTripInput = Omit<TripModel, "id" | "createdAt">;
export type UpdateTripInput = Partial<Omit<TripModel, "id" | "createdAt">>;

export type CreateExcursionInput = Omit<ExcursionModel, "id" | "createdAt">;
export type UpdateExcursionInput = Partial<
  Omit<ExcursionModel, "id" | "tripId" | "createdAt">
>;
