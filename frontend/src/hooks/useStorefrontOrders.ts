"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Order } from "./useOrders";

export function useStorefrontOrders({ tenantId, userEmail }: { tenantId: string, userEmail: string | null }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId || !userEmail) {
            setLoading(false);
            setOrders([]);
            return;
        }

        // Fetch from the new estimates subcollection
        const estimatesRef = collection(db, `tenants/${tenantId}/estimates`);

        // Filter by customer email
        const q = query(
            estimatesRef,
            where("customerInfo.email", "==", userEmail),
            // Note: orderBy requires an index if used with where on a different field. 
            // If this fails, we might need to remove orderBy and sort client-side, or create the index.
            // For now, let's try without orderBy and sort client-side to avoid index errors immediately.
            // orderBy("createdAt", "desc") 
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const ordersData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        status: data.status || 'pending'
                    };
                }) as Order[];

                // Client-side sort
                ordersData.sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                    return dateB.getTime() - dateA.getTime();
                });

                setOrders(ordersData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching storefront orders:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [tenantId, userEmail]);

    return { orders, loading };
}
