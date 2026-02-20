import { FirebaseApp, initializeApp, getApps, getApp } from "firebase/app";
import { Auth, getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { Analytics, getAnalytics, isSupported } from "firebase/analytics";

export const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (Singleton pattern)
let app: FirebaseApp | undefined;
let auth: Auth | any = null;
let db: Firestore | any = null;
let storage: FirebaseStorage | any = null;
let analytics: Analytics | undefined;

try {
    if (firebaseConfig.apiKey) {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);

        if (typeof window !== "undefined") {
            // Set auth persistence to local storage (persists even after browser close)
            setPersistence(auth, browserLocalPersistence).catch((error) => {
                console.error("Error setting auth persistence:", error);
            });

            isSupported().then((supported) => {
                if (supported && app) {
                    analytics = getAnalytics(app);
                }
            });
        }
    } else {
        console.warn("Firebase API Key is missing. Check your environment variables (NEXT_PUBLIC_FIREBASE_API_KEY).");
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export const isFirebaseReady = !!(auth && db);
export { app, auth, db, storage, analytics };
