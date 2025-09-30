import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebase.config";
import { ExcursionModel, ScrapbookState, TripModel } from "../types/scrapbook";

export async function pullFromFirestore(
  userId: string
): Promise<ScrapbookState> {
  const tripsCol = collection(FIREBASE_DB, `users/${userId}/trips`);
  const tripsSnap = await getDocs(tripsCol);
  const trips: TripModel[] = [];
  const excursionsByTripId: Record<string, ExcursionModel[]> = {};

  for (const tripDoc of tripsSnap.docs) {
    const trip = tripDoc.data() as TripModel;
    trips.push({ ...trip, id: tripDoc.id });
    const exCol = collection(
      FIREBASE_DB,
      `users/${userId}/trips/${tripDoc.id}/excursions`
    );
    const exSnap = await getDocs(exCol);
    excursionsByTripId[tripDoc.id] = exSnap.docs.map((d) => ({
      ...(d.data() as ExcursionModel),
      id: d.id,
    }));
  }

  return { trips, excursionsByTripId, lastSyncedAt: new Date().toISOString() };
}

export async function pushToFirestore(
  userId: string,
  state: ScrapbookState
): Promise<void> {
  // naive two-way: overwrite remote with local snapshot for now
  // Upserts trips and excursions; does not delete remote extras.
  for (const trip of state.trips) {
    const tripRef = doc(FIREBASE_DB, `users/${userId}/trips/${trip.id}`);
    await setDoc(tripRef, { ...trip, id: undefined }, { merge: true });
    const excursions = state.excursionsByTripId[trip.id] || [];
    for (const ex of excursions) {
      const exRef = doc(
        FIREBASE_DB,
        `users/${userId}/trips/${trip.id}/excursions/${ex.id}`
      );
      await setDoc(exRef, { ...ex, id: undefined }, { merge: true });
    }
  }
}

export async function deleteTripRemote(
  userId: string,
  tripId: string
): Promise<void> {
  const tripRef = doc(FIREBASE_DB, `users/${userId}/trips/${tripId}`);
  await deleteDoc(tripRef);
}

