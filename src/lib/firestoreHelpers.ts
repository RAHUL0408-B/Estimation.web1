import { db } from "./firebase";
import {
    collection,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    Timestamp,
    query,
    where,
    getDocs,
    getDoc,
} from "firebase/firestore";

export interface Tenant {
    id: string;
    ownerUid?: string;
    name: string;
    email: string;
    phone?: string;
    businessName: string;
    storeId: string;
    status: "pending" | "active" | "inactive" | "rejected";
    createdAt: Timestamp;
    approvedAt?: Timestamp;
    activatedAt?: Timestamp;
    subscription: {
        plan: "free" | "basic" | "pro" | "enterprise";
        status: "active" | "cancelled" | "expired";
        startDate: Timestamp;
        endDate?: Timestamp;
    };
    revenue: {
        total: number;
        lastMonth: number;
        thisMonth: number;
    };
}

export interface Activity {
    id: string;
    type: "signup" | "store_activated" | "payment" | "approval" | "rejection";
    description: string;
    tenantId?: string;
    tenantName?: string;
    createdAt: Timestamp;
    metadata?: Record<string, any>;
}

/**
 * Approve a pending tenant
 */
export async function approveTenant(tenantId: string): Promise<void> {
    const tenantRef = doc(db, "tenants", tenantId);

    // Get tenant data for email
    const tenantData = await getTenantById(tenantId);

    await updateDoc(tenantRef, {
        status: "active",
        approvedAt: serverTimestamp(),
    });

    // Log activity
    await createActivity(
        "approval",
        "Tenant approved",
        { tenantId }
    );

    // TODO: Send real email notification when email service is configured
}

/**
 * Reject a pending tenant
 */
export async function rejectTenant(tenantId: string): Promise<void> {
    const tenantRef = doc(db, "tenants", tenantId);

    // Get tenant data for email
    const tenantData = await getTenantById(tenantId);

    await updateDoc(tenantRef, {
        status: "rejected",
    });

    // Log activity
    await createActivity(
        "rejection",
        "Tenant rejected",
        { tenantId }
    );

    // TODO: Send real email notification when email service is configured
}

/**
 * Create a new activity log entry
 */
export async function createActivity(
    type: Activity["type"],
    description: string,
    metadata?: Record<string, any>
): Promise<void> {
    const activitiesRef = collection(db, "activities");

    await addDoc(activitiesRef, {
        type,
        description,
        createdAt: serverTimestamp(),
        metadata: metadata || {},
    });
}

/**
 * Calculate growth rate percentage
 */
export function calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: Timestamp): string {
    const now = new Date();
    const date = timestamp.toDate();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
}

/**
 * Generate a URL-friendly store ID from business name
 */
export function generateStoreId(businessName: string): string {
    return businessName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

/**
 * Add a new designer/tenant
 */
export async function addDesigner(designerData: {
    uid?: string;
    name: string;
    email: string;
    phone?: string;
    businessName: string;
    storeId: string;
    plan: "free" | "basic" | "pro" | "enterprise";
}): Promise<void> {
    const tenantsRef = collection(db, "tenants");

    // Check for storeId uniqueness
    let uniqueStoreId = designerData.storeId;
    let counter = 1;
    let exists = true;

    while (exists) {
        const q = query(tenantsRef, where("storeId", "==", uniqueStoreId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            exists = false;
        } else {
            uniqueStoreId = `${designerData.storeId}-${counter}`;
            counter++;
        }
    }

    await addDoc(tenantsRef, {
        ownerUid: designerData.uid || "",
        name: designerData.name,
        email: designerData.email,
        phone: designerData.phone || "",
        businessName: designerData.businessName,
        storeId: uniqueStoreId,
        status: "pending",
        createdAt: serverTimestamp(),
        subscription: {
            plan: designerData.plan,
            status: "active",
            startDate: serverTimestamp(),
        },
        revenue: {
            total: 0,
            lastMonth: 0,
            thisMonth: 0,
        },
    });

    // Log activity
    await createActivity(
        "signup",
        `New designer signup: ${designerData.name}`,
        { email: designerData.email, storeId: uniqueStoreId }
    );
}

/**
 * Update a designer/tenant
 */
export async function updateDesigner(
    tenantId: string,
    updates: Partial<Tenant>
): Promise<void> {
    const tenantRef = doc(db, "tenants", tenantId);
    await updateDoc(tenantRef, updates);
}

/**
 * Delete a designer/tenant
 */
export async function deleteDesigner(tenantId: string): Promise<void> {
    const tenantRef = doc(db, "tenants", tenantId);
    await updateDoc(tenantRef, {
        status: "rejected",
    });

    await createActivity(
        "rejection",
        "Designer account deleted",
        { tenantId }
    );
}

/**
 * Get tenant by email
 */
export async function getTenantByEmail(email: string): Promise<Tenant | null> {
    const tenantsRef = collection(db, "tenants");
    const q = query(tenantsRef, where("email", "==", email));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Tenant;
}

/**
 * Get tenant by ID
 */
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
    const tenantRef = doc(db, "tenants", tenantId);
    const snapshot = await getDoc(tenantRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as Tenant;
}

/**
 * Get tenant by store ID (URL slug)
 */
export async function getTenantByStoreId(storeId: string): Promise<Tenant | null> {
    const tenantsRef = collection(db, "tenants");
    const q = query(tenantsRef, where("storeId", "==", storeId));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Tenant;
}
