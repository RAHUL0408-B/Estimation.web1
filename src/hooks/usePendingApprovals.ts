"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Tenant, approveTenant, rejectTenant } from "@/lib/firestoreHelpers";

export interface PendingApproval extends Tenant {
    // Inherits all Tenant properties
}

export function usePendingApprovals() {
    const [approvals, setApprovals] = useState<PendingApproval[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tenantsRef = collection(db, "tenants");
        const q = query(
            tenantsRef,
            where("status", "==", "pending"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pendingList: PendingApproval[] = [];

            snapshot.forEach((doc) => {
                pendingList.push({ id: doc.id, ...doc.data() } as PendingApproval);
            });

            setApprovals(pendingList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (tenantId: string) => {
        try {
            await approveTenant(tenantId);
        } catch (error) {
            console.error("Error approving tenant:", error);
            throw error;
        }
    };

    const handleReject = async (tenantId: string) => {
        try {
            await rejectTenant(tenantId);
        } catch (error) {
            console.error("Error rejecting tenant:", error);
            throw error;
        }
    };

    return {
        approvals,
        loading,
        handleApprove,
        handleReject,
    };
}
