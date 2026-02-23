"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "@/lib/firebaseWrapper";

export interface Estimate {
    id: string;
    customerName: string;
    phoneNumber: string;
    email: string;
    type: string;
    amount: number;
    status: "pending" | "approved" | "contacted" | "rejected";
    createdAt: any;
    pdfLink?: string;
    tenantId: string;
}

export function useEstimates(tenantId: string | null) {
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        const estimatesRef = collection(db, "estimates");
        const q = query(
            estimatesRef,
            where("tenantId", "==", tenantId),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const estimatesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Estimate[];
            setEstimates(estimatesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [tenantId]);

    return { estimates, loading };
}
