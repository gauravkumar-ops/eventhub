/**
 * EventHub — Firebase Configuration Loader
 * 
 * Supports reading configuration from:
 * 1. Global runtime window/env variables (e.g. injected at build time, serverless runtime, or via Vercel env script)
 * 2. Process environment variables if bundled with Vite/Webpack/Next.js/Parcel
 * 3. Default fallback configuration (API key should be set via environment variables or runtime)
 */

export const firebaseConfig = {
  apiKey:
    (typeof window !== "undefined" && window.__ENV__?.FIREBASE_API_KEY) ||
    (typeof window !== "undefined" && window.FIREBASE_API_KEY) ||
    (typeof process !== "undefined" && process.env?.FIREBASE_API_KEY) ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_FIREBASE_API_KEY) ||
    (typeof process !== "undefined" && process.env?.VITE_FIREBASE_API_KEY) ||
    "",
  authDomain:
    (typeof window !== "undefined" && window.__ENV__?.FIREBASE_AUTH_DOMAIN) ||
    (typeof window !== "undefined" && window.FIREBASE_AUTH_DOMAIN) ||
    (typeof process !== "undefined" && process.env?.FIREBASE_AUTH_DOMAIN) ||
    "event-hub-36864.firebaseapp.com",
  projectId:
    (typeof window !== "undefined" && window.__ENV__?.FIREBASE_PROJECT_ID) ||
    (typeof window !== "undefined" && window.FIREBASE_PROJECT_ID) ||
    (typeof process !== "undefined" && process.env?.FIREBASE_PROJECT_ID) ||
    "event-hub-36864",
  storageBucket:
    (typeof window !== "undefined" && window.__ENV__?.FIREBASE_STORAGE_BUCKET) ||
    (typeof window !== "undefined" && window.FIREBASE_STORAGE_BUCKET) ||
    (typeof process !== "undefined" && process.env?.FIREBASE_STORAGE_BUCKET) ||
    "event-hub-36864.firebasestorage.app",
  messagingSenderId:
    (typeof window !== "undefined" && window.__ENV__?.FIREBASE_MESSAGING_SENDER_ID) ||
    (typeof window !== "undefined" && window.FIREBASE_MESSAGING_SENDER_ID) ||
    (typeof process !== "undefined" && process.env?.FIREBASE_MESSAGING_SENDER_ID) ||
    "260968384601",
  appId:
    (typeof window !== "undefined" && window.__ENV__?.FIREBASE_APP_ID) ||
    (typeof window !== "undefined" && window.FIREBASE_APP_ID) ||
    (typeof process !== "undefined" && process.env?.FIREBASE_APP_ID) ||
    "1:260968384601:web:3d825f81f8f3d6351ec948"
};

/**
 * Validates that the Firebase API key is configured before making auth calls.
 * Displays a helpful warning if missing in development / preview environments.
 */
export function checkFirebaseConfig() {
  if (!firebaseConfig.apiKey) {
    console.warn(
      "[EventHub] Warning: Firebase API Key is not set. Please set FIREBASE_API_KEY in your .env or Vercel Environment Variables."
    );
  }
}
