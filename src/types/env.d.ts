declare module "@env" {
  export const EXPO_PUBLIC_IOS_CLIENT_ID: string;
  export const EXPO_PUBLIC_ANDROID_CLIENT_ID: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_IOS_CLIENT_ID: string;
    EXPO_PUBLIC_ANDROID_CLIENT_ID: string;
    EXPO_PUBLIC_GOOGLE_MAP_KEY: string;
    NODE_ENV: "development" | "production" | "test";
    // Add other environment variables as needed
  }
}
