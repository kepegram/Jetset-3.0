declare module "@env" {
  export const EXPO_PUBLIC_WEATHER_API_KEY: string;
  export const EXPO_PUBLIC_IOS_CLIENT_ID: string;
  export const EXPO_PUBLIC_ANDROID_CLIENT_ID: string;
  export const EXPO_PUBLIC_GOOGLE_MAP_KEY: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_GOOGLE_MAP_KEY: string;
    NODE_ENV: "development" | "production" | "test";
    // Add other environment variables as needed
  }
}
