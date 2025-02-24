import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, User } from "firebase/auth";
import { FIREBASE_DB } from "../../firebase.config";

// Enhanced interface to include more user data
interface ProfileContextType {
  profilePicture: string;
  setProfilePicture: (uri: string) => void;
  displayName: string;
  setDisplayName: (name: string) => Promise<void>; // Make async
  isLoading: boolean;
  email: string | null; // Add email
  authProvider: string | null; // Add auth provider info
  refreshUserData: () => Promise<void>; // Add refresh function
}

export const ProfileContext = createContext<ProfileContextType | undefined>(
  undefined
);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profilePicture, setProfilePictureState] = useState<string>(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png"
  );
  const [displayName, setDisplayNameState] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<string | null>(null);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const user = getAuth().currentUser;

      if (user) {
        // Get auth provider
        const provider = user.providerData[0]?.providerId || "unknown";
        setAuthProvider(provider);
        setEmail(user.email);

        // Load from Firestore first
        const userDocRef = doc(FIREBASE_DB, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          // Prefer Firestore data over Google data
          if (data.username) {
            setDisplayNameState(data.username);
            await AsyncStorage.setItem("displayName", data.username);
          }
          if (data.profilePicture) {
            setProfilePictureState(data.profilePicture);
            await AsyncStorage.setItem("profilePicture", data.profilePicture);
          }
        } else {
          // If no Firestore document exists, create one with Google data
          if (provider === "google.com") {
            await setDoc(userDocRef, {
              username: user.displayName || "User",
              email: user.email,
              profilePicture: user.photoURL,
              createdAt: new Date().toISOString(),
              authProvider: "google",
            });
            
            if (user.displayName) {
              setDisplayNameState(user.displayName);
              await AsyncStorage.setItem("displayName", user.displayName);
            }
            if (user.photoURL) {
              setProfilePictureState(user.photoURL);
              await AsyncStorage.setItem("profilePicture", user.photoURL);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const setProfilePicture = async (uri: string) => {
    try {
      const user = getAuth().currentUser;
      if (user) {
        const userDocRef = doc(FIREBASE_DB, "users", user.uid);
        await setDoc(userDocRef, { profilePicture: uri }, { merge: true });
        await AsyncStorage.setItem("profilePicture", uri);
        setProfilePictureState(uri);
      }
    } catch (error) {
      console.error("Failed to set profile picture:", error);
    }
  };

  const setDisplayName = async (name: string) => {
    try {
      const user = getAuth().currentUser;
      if (user) {
        const userDocRef = doc(FIREBASE_DB, "users", user.uid);
        await setDoc(userDocRef, { username: name }, { merge: true });
        await AsyncStorage.setItem("displayName", name);
        setDisplayNameState(name);
      }
    } catch (error) {
      console.error("Failed to set display name:", error);
      throw error; // Propagate error to handle in UI
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profilePicture,
        setProfilePicture,
        displayName,
        setDisplayName,
        isLoading,
        email,
        authProvider,
        refreshUserData: loadProfileData,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
