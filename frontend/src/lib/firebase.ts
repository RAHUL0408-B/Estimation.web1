import { app, auth, db, storage, isFirebaseReady } from "@/lib/firebaseWrapper";

// Dummy analytics since Supabase doesn't have a direct equivalent in the basic setup
export const analytics = undefined;

export { app, auth, db, storage, isFirebaseReady };
