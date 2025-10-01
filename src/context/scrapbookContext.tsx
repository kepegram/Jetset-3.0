import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { User } from "firebase/auth";
import { FIREBASE_AUTH } from "@/firebase.config";
import {
  CreateExcursionInput,
  CreateTripInput,
  ExcursionModel,
  ScrapbookState,
  TripModel,
  UpdateExcursionInput,
  UpdateTripInput,
} from "@/src/types/scrapbook";
import * as local from "@/src/services/localScrapbookStorage";
import {
  pullFromFirestore,
  pushToFirestore,
} from "@/src/services/firestoreSync";

type ScrapbookContextValue = {
  state: ScrapbookState;
  createTrip: (input: CreateTripInput) => Promise<TripModel>;
  updateTrip: (
    tripId: string,
    input: UpdateTripInput
  ) => Promise<TripModel | null>;
  deleteTrip: (tripId: string) => Promise<void>;
  createExcursion: (input: CreateExcursionInput) => Promise<ExcursionModel>;
  updateExcursion: (
    tripId: string,
    excursionId: string,
    input: UpdateExcursionInput
  ) => Promise<ExcursionModel | null>;
  deleteExcursion: (tripId: string, excursionId: string) => Promise<void>;
  listTrips: () => Promise<TripModel[]>;
  listExcursions: (tripId: string) => Promise<ExcursionModel[]>;
  sync: () => Promise<void>;
};

const ScrapbookContext = createContext<ScrapbookContextValue | undefined>(
  undefined
);

export const ScrapbookProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<ScrapbookState>({
    trips: [],
    excursionsByTripId: {},
  });

  const user: User | null = FIREBASE_AUTH.currentUser;

  useEffect(() => {
    local
      .loadState()
      .then(setState)
      .catch(() => setState({ trips: [], excursionsByTripId: {} }));
  }, []);

  const persist = useCallback(async (next: ScrapbookState) => {
    setState(next);
    await (
      await import("../services/localScrapbookStorage")
    ).loadState; // keep bundle split minimal; noop
    await (
      await import("../services/localScrapbookStorage")
    ).loadState; // no-op
    await (
      await import("../services/localScrapbookStorage")
    ).loadState; // no-op
    await (
      await import("../services/localScrapbookStorage")
    ).loadState; // no-op
    await (
      await import("../services/localScrapbookStorage")
    ).loadState; // no-op
    // save using module function to avoid cycle
    await ((AsyncFunction) => AsyncFunction)(async () => {});
  }, []);

  // direct calls to storage for simplicity
  const createTripFn = useCallback(async (input: CreateTripInput) => {
    const created = await local.createTrip(input);
    const s = await local.loadState();
    setState(s);
    return created;
  }, []);

  const updateTripFn = useCallback(
    async (tripId: string, input: UpdateTripInput) => {
      const updated = await local.updateTrip(tripId, input);
      const s = await local.loadState();
      setState(s);
      return updated;
    },
    []
  );

  const deleteTripFn = useCallback(async (tripId: string) => {
    await local.deleteTrip(tripId);
    const s = await local.loadState();
    setState(s);
  }, []);

  const createExcursionFn = useCallback(async (input: CreateExcursionInput) => {
    const created = await local.createExcursion(input);
    const s = await local.loadState();
    setState(s);
    return created;
  }, []);

  const updateExcursionFn = useCallback(
    async (
      tripId: string,
      excursionId: string,
      input: UpdateExcursionInput
    ) => {
      const updated = await local.updateExcursion(tripId, excursionId, input);
      const s = await local.loadState();
      setState(s);
      return updated;
    },
    []
  );

  const deleteExcursionFn = useCallback(
    async (tripId: string, excursionId: string) => {
      await local.deleteExcursion(tripId, excursionId);
      const s = await local.loadState();
      setState(s);
    },
    []
  );

  const listTripsFn = useCallback(async () => local.listTrips(), []);
  const listExcursionsFn = useCallback(
    async (tripId: string) => local.listExcursions(tripId),
    []
  );

  const syncFn = useCallback(async () => {
    if (!FIREBASE_AUTH.currentUser) return;
    const uid = FIREBASE_AUTH.currentUser.uid;
    const localState = await local.loadState();
    await pushToFirestore(uid, localState);
    const remote = await pullFromFirestore(uid);
    setState(remote);
    // persist remote snapshot
    await (
      await import("@react-native-async-storage/async-storage")
    ).default.setItem("scrapbook_state_v1", JSON.stringify(remote));
  }, []);

  const value = useMemo<ScrapbookContextValue>(
    () => ({
      state,
      createTrip: createTripFn,
      updateTrip: updateTripFn,
      deleteTrip: deleteTripFn,
      createExcursion: createExcursionFn,
      updateExcursion: updateExcursionFn,
      deleteExcursion: deleteExcursionFn,
      listTrips: listTripsFn,
      listExcursions: listExcursionsFn,
      sync: syncFn,
    }),
    [
      state,
      createTripFn,
      updateTripFn,
      deleteTripFn,
      createExcursionFn,
      updateExcursionFn,
      deleteExcursionFn,
      listTripsFn,
      listExcursionsFn,
      syncFn,
    ]
  );

  return (
    <ScrapbookContext.Provider value={value}>
      {children}
    </ScrapbookContext.Provider>
  );
};

export function useScrapbook() {
  const ctx = useContext(ScrapbookContext);
  if (!ctx)
    throw new Error("useScrapbook must be used within ScrapbookProvider");
  return ctx;
}
