import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Check if Firebase environment variables are set
const hasFirebaseConfig =
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (hasFirebaseConfig) {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string;
  const authDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || `${projectId}.firebaseapp.com`;
  // Firebase introduced firebasestorage.app, but older projects use appspot.com – allow override
  const storageBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || `${projectId}.firebasestorage.app`;

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain,
    projectId,
    storageBucket,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  } as const;

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.warn("Firebase initialization failed:", error);
    console.warn("Firebase features will be disabled. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID to enable.");
  }
} else {
  console.warn("Firebase configuration not found. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID environment variables to enable Firebase features.");
  console.warn("The app will continue to work with backend authentication.");
}

export { auth, db, storage };
export default app;
