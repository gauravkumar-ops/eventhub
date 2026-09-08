/**
 * EventHub — Firebase Configuration Loader
 * 
 * Supports dynamic configuration loading:
 * 1. Asynchronously fetches /api/config from Vercel Serverless Function
 * 2. Window globals or build-time injected environment variables
 * 3. Fallback to localStorage or cached config
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Default base configuration (non-sensitive project identifiers)
export let firebaseConfig = {
  apiKey:
    (typeof window !== "undefined" && window.__ENV__?.FIREBASE_API_KEY) ||
    (typeof window !== "undefined" && window.FIREBASE_API_KEY) ||
    (typeof window !== "undefined" && localStorage.getItem('eventhub_firebase_api_key')) ||
    "",
  authDomain: "event-hub-36864.firebaseapp.com",
  projectId: "event-hub-36864",
  storageBucket: "event-hub-36864.firebasestorage.app",
  messagingSenderId: "260968384601",
  appId: "1:260968384601:web:3d825f81f8f3d6351ec948"
};

let appInstance = null;
let authInstance = null;

/**
 * Initializes and returns the Firebase Auth instance.
 * Automatically fetches the API key from Vercel environment endpoint `/api/config` if not already present.
 */
export async function getFirebaseAuth() {
  if (authInstance) return authInstance;

  // If apiKey is missing, attempt to fetch from Vercel Serverless endpoint /api/config
  if (!firebaseConfig.apiKey) {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.apiKey) {
          firebaseConfig = { ...firebaseConfig, ...data };
          if (typeof window !== "undefined") {
            try { localStorage.setItem('eventhub_firebase_api_key', data.apiKey); } catch (_) {}
          }
        }
      }
    } catch (_) {
      // Offline / non-server environment fallback
    }
  }

  // Initialize Firebase App
  if (!appInstance) {
    appInstance = initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
  }

  return authInstance;
}

export function checkFirebaseConfig() {
  if (!firebaseConfig.apiKey && typeof window !== "undefined" && !window.location.hostname.includes('vercel.app')) {
    console.info(
      "[EventHub] Firebase API key will be dynamically loaded from Vercel /api/config on deployment."
    );
  }
}
