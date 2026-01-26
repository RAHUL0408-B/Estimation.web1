"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export interface ConsultationRequest {
    id: string;
    clientName: string;
    phone?: string;
    phoneNumber?: string;
    email?: string;
    source: string;
    requirement: string;
    status: "new" | "contacted" | "closed";
    createdAt: any;
    tenantId: string;
}

export function useConsultations(tenantId: string | null) {
    const [requests, setRequests] = useState<ConsultationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        new: 0,
        inProgress: 0,
        conversionRate: 0
    });

    useEffect(() => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        const consultationsRef = collection(db, "consultation_requests");
        const q = query(consultationsRef, where("tenantId", "==", tenantId));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const requestsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as ConsultationRequest[];

                // Sort by createdAt manually
                requestsData.sort((a, b) => {
                    if (!a.createdAt || !b.createdAt) return 0;
                    return b.createdAt.toMillis() - a.createdAt.toMillis();
                });

                setRequests(requestsData);

                // Calculate stats
                const newCount = requestsData.filter(r => r.status === "new").length;
                const contactedCount = requestsData.filter(r => r.status === "contacted").length;
                const closedCount = requestsData.filter(r => r.status === "closed").length;
                const total = requestsData.length;

                setStats({
                    new: newCount,
                    inProgress: contactedCount,
                    conversionRate: total > 0 ? Math.round((closedCount / total) * 100) : 0
                });

                setLoading(false);
            },
            (error) => {
                console.error("Error fetching consultation requests:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [tenantId]);

    return { requests, stats, loading };
}
