import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CreateExcursionInput,
  CreateTripInput,
  ExcursionModel,
  ScrapbookState,
  TripModel,
  UpdateExcursionInput,
  UpdateTripInput,
} from "@/src/types/scrapbook";

const STORAGE_KEY = "scrapbook_state_v1";

export async function loadState(): Promise<ScrapbookState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { trips: [], excursionsByTripId: {} };
  }
  try {
    return JSON.parse(raw) as ScrapbookState;
  } catch {
    return { trips: [], excursionsByTripId: {} };
  }
}

async function saveState(state: ScrapbookState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nowIso(): string {
  return new Date().toISOString();
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createTrip(input: CreateTripInput): Promise<TripModel> {
  const state = await loadState();
  const trip: TripModel = {
    id: generateId("trip"),
    createdAt: nowIso(),
    coverPhotoUri: null,
    ...input,
  };
  state.trips.push(trip);
  if (!state.excursionsByTripId[trip.id])
    state.excursionsByTripId[trip.id] = [];
  await saveState(state);
  return trip;
}

export async function updateTrip(
  tripId: string,
  input: UpdateTripInput
): Promise<TripModel | null> {
  const state = await loadState();
  const idx = state.trips.findIndex((t) => t.id === tripId);
  if (idx === -1) return null;
  const updated: TripModel = { ...state.trips[idx], ...input };
  state.trips[idx] = updated;
  await saveState(state);
  return updated;
}

export async function deleteTrip(tripId: string): Promise<void> {
  const state = await loadState();
  state.trips = state.trips.filter((t) => t.id !== tripId);
  delete state.excursionsByTripId[tripId];
  await saveState(state);
}

export async function listTrips(): Promise<TripModel[]> {
  const state = await loadState();
  return state.trips
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createExcursion(
  input: CreateExcursionInput
): Promise<ExcursionModel> {
  const state = await loadState();
  const ex: ExcursionModel = {
    id: generateId("ex"),
    createdAt: nowIso(),
    ...input,
    photoUris: input.photoUris || [],
  };
  if (!state.excursionsByTripId[ex.tripId])
    state.excursionsByTripId[ex.tripId] = [];
  state.excursionsByTripId[ex.tripId].push(ex);
  await saveState(state);
  return ex;
}

export async function updateExcursion(
  tripId: string,
  excursionId: string,
  input: UpdateExcursionInput
): Promise<ExcursionModel | null> {
  const state = await loadState();
  const list = state.excursionsByTripId[tripId];
  if (!list) return null;
  const idx = list.findIndex((e) => e.id === excursionId);
  if (idx === -1) return null;
  const updated: ExcursionModel = { ...list[idx], ...input };
  list[idx] = updated;
  await saveState(state);
  return updated;
}

export async function deleteExcursion(
  tripId: string,
  excursionId: string
): Promise<void> {
  const state = await loadState();
  const list = state.excursionsByTripId[tripId];
  if (!list) return;
  state.excursionsByTripId[tripId] = list.filter((e) => e.id !== excursionId);
  await saveState(state);
}

export async function listExcursions(
  tripId: string
): Promise<ExcursionModel[]> {
  const state = await loadState();
  return (state.excursionsByTripId[tripId] || [])
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
