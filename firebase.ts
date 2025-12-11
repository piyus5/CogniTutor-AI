import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * FIREBASE CONFIGURATION
 * ----------------------
 * To make the authentication work in reality (Real Sign Up, Login, and Magic Links),
 * you must create a free project at https://console.firebase.google.com/
 * 
 * 1. Create a new project.
 * 2. Go to "Build" -> "Authentication".
 * 3. Enable "Email/Password" in the Sign-in method tab.
 * 4. Go to Project Settings (Gear icon) -> General -> "Your apps".
 * 5. Create a Web App and copy the "firebaseConfig" object below.
 */

// REPLACE THE VALUES BELOW WITH YOUR ACTUAL FIREBASE KEYS
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

// Initialize Firebase only if the config has been updated by the developer
let app;
let auth: any = null;

export const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY";
};

try {
    if (isFirebaseConfigured()) {
       app = initializeApp(firebaseConfig);
       auth = getAuth(app);
    } else {
        console.warn("Firebase is not configured. Authentication will show setup guide.");
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

export { auth };