import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "@/lib/firebaseWrapper";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const tenantId = formData.get("tenantId") as string;
        const folder = formData.get("folder") as string || "general";

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
        }

        // Generate a unique filename
        const extension = file.name.split('.').pop();
        const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

        // Define storage path: tenants/[tenantId]/[folder]/[filename]
        const storagePath = `tenants/${tenantId}/${folder}/${filename}`;
        const storageRef = ref(storage, storagePath);

        // Convert File to ArrayBuffer for Firebase
        const arrayBuffer = await file.arrayBuffer();

        // Upload to Firebase Storage
        const snapshot = await uploadBytes(storageRef, arrayBuffer, {
            contentType: file.type,
        });

        // Get the permanent download URL
        const url = await getDownloadURL(snapshot.ref);

        return NextResponse.json({ url });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
