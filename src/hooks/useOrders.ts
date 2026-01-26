"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export interface Order {
    id: string;
    estimateId: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    carpetArea?: number;
    numberOfRooms?: number;
    rooms?: string[];
    selectedRooms?: string[];
    materialGrade?: string;
    finishType?: string;
    estimatedAmount?: number;
    status: "pending" | "approved" | "rejected" | "generated";
    createdAt?: any;
    companyId?: string;
    tenantId: string;
    storeId?: string;
    createdByUserId?: string;
    createdByRole?: string;
    pdfUrl?: string;
}

export function useOrders(tenantId: string | null, storeId?: string | null) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        totalValue: 0
    });

    useEffect(() => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("tenantId", "==", tenantId));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const ordersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Order[];

                // Sort by createdAt manually
                ordersData.sort((a, b) => {
                    if (!a.createdAt || !b.createdAt) return 0;
                    return b.createdAt.toMillis() - a.createdAt.toMillis();
                });

                setOrders(ordersData);

                // Calculate stats
                const pendingCount = ordersData.filter(o => o.status === "pending").length;
                const approvedCount = ordersData.filter(o => o.status === "approved").length;
                const rejectedCount = ordersData.filter(o => o.status === "rejected").length;
                const totalValue = ordersData.reduce((sum, o) => sum + (o.estimatedAmount || 0), 0);

                setStats({
                    pending: pendingCount,
                    approved: approvedCount,
                    rejected: rejectedCount,
                    totalValue: totalValue
                });

                setLoading(false);
            },
            (error) => {
                console.error("Error fetching orders:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [tenantId, storeId]);

    const updateOrderStatus = async (orderId: string, status: "pending" | "approved" | "rejected") => {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, { status });
            return true;
        } catch (error) {
            console.error("Error updating order status:", error);
            return false;
        }
    };

    const updateOrderDetails = async (orderId: string, updates: Partial<Order>) => {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, updates);
            return true;
        } catch (error) {
            console.error("Error updating order details:", error);
            return false;
        }
    };

    return { orders, stats, loading, updateOrderStatus, updateOrderDetails };
}
