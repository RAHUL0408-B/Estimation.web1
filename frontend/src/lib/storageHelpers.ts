import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "@/lib/firebaseWrapper";

/**
 * Uploads a file to Firebase Storage and returns the download URL
 * @param file The file to upload
 * @param path The path in storage (e.g. "portfolio/tenantId/filename")
 */
export async function uploadImage(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}
