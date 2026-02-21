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
    const missingKeys = Object.entries(firebaseConfig)
        .filter(([key, value]) => !value && key !== 'measurementId')
        .map(([key]) => key);

    if (missingKeys.length === 0) {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);

        if (typeof window !== "undefined" && auth) {
            setPersistence(auth, browserLocalPersistence).catch((e) => console.error("Persistence error:", e));
            isSupported().then((supported) => {
                if (supported && app) analytics = getAnalytics(app);
            });
        }
    } else {
        console.warn(`Firebase initialization skipped. Missing environment variables: ${missingKeys.join(", ")}`);
        console.warn("Ensure variables starting with NEXT_PUBLIC_ are set in your deployment dashboard.");
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export const isFirebaseReady = !!(auth && db);
export { app, auth, db, storage, analytics };
