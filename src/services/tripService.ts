import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { FIREBASE_DB } from "../../firebase.config";
import { Trip } from "../types/trip";
import moment from "moment";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchUserName = async (userId: string): Promise<string> => {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return data?.name || data?.username || "";
      }
      return "";
    } catch (error) {
      if (retries === MAX_RETRIES - 1) throw error;
      await delay(RETRY_DELAY);
      retries++;
    }
  }
  return "";
};

export const determineTripsStatus = (
  startDate: string,
  endDate: string
): "up" | "cur" | "past" => {
  const today = moment().startOf("day");
  const start = moment(startDate);
  const end = moment(endDate);

  if (start.isAfter(today)) return "up";
  if (end.isBefore(today)) return "past";
  return "cur";
};

export const updateTripStatus = async (
  userId: string,
  oldId: string,
  newStatus: string,
  data: any
): Promise<any> => {
  const newId = `${newStatus}_${oldId.split("_")[1]}`;
  const oldDocRef = doc(FIREBASE_DB, `users/${userId}/userTrips/${oldId}`);
  const newDocRef = doc(FIREBASE_DB, `users/${userId}/userTrips/${newId}`);

  await setDoc(newDocRef, {
    ...data,
    docId: newId,
  });
  await deleteDoc(oldDocRef);

  return {
    id: newId,
    ...data,
    docId: newId,
    subcollection:
      newStatus === "up"
        ? "upcoming"
        : newStatus === "cur"
        ? "current"
        : "past",
  };
};

export const fetchUserTrips = async (userId: string): Promise<any[]> => {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const tripsRef = collection(FIREBASE_DB, `users/${userId}/userTrips`);
      const snapshot = await getDocs(tripsRef);

      if (snapshot.empty) {
        console.log("No trips found for user:", userId);
        return [];
      }

      console.log(`Found ${snapshot.docs.length} trips for user:`, userId);

      const allTrips = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const id = docSnapshot.id;

          if (
            !data.tripData ||
            !data.tripData.startDate ||
            !data.tripData.endDate
          ) {
            console.warn("Trip missing required data:", id);
            return null;
          }

          const currentStatus = determineTripsStatus(
            data.tripData.startDate,
            data.tripData.endDate
          );

          const currentPrefix = id.split("_")[0];
          if (currentPrefix !== currentStatus) {
            console.log(
              `Updating trip status for ${id} from ${currentPrefix} to ${currentStatus}`
            );
            return await updateTripStatus(userId, id, currentStatus, data);
          }

          return {
            id: id,
            ...data,
            subcollection:
              currentPrefix === "up"
                ? "upcoming"
                : currentPrefix === "cur"
                ? "current"
                : "past",
          };
        })
      );

      // Filter out any null values from trips with missing data
      return allTrips.filter((trip) => trip !== null);
    } catch (error) {
      console.error("Error fetching trips:", error);
      if (retries === MAX_RETRIES - 1) throw error;
      await delay(RETRY_DELAY);
      retries++;
    }
  }
  return [];
};
