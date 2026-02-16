"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";

export interface Order {
    id: string;
    // New Structure Fields
    customerInfo?: {
        name: string;
        phone: string;
        email: string;
        city: string;
    };
    segment?: 'Residential' | 'Commercial';
    plan?: 'Basic' | 'Standard' | 'Luxe';
    carpetArea?: number;
    bedrooms?: number; // counts
    bathrooms?: number; // counts
    configuration?: {
        livingArea?: { [itemId: string]: number };
        kitchen?: {
            layout: string;
            material: string;
            items: { [itemId: string]: number };
        };
        bedrooms?: Array<{ items: { [itemId: string]: number } }>;
        bathrooms?: Array<{ items: { [itemId: string]: number } }>;
    };
    totalAmount?: number;

    // Legacy/Shared Fields
    status?: "pending" | "approved" | "rejected" | "generated"; // We might need to add status to the new estimate creation
    createdAt?: any;
    tenantId: string;
    pdfUrl?: string;
    assignedTo?: string;
    assignedToName?: string;
    assignmentStatus?: "pending" | "accepted" | "completed";

    // Legacy Fields (kept for compatibility if needed, though we are switching source)
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    estimatedAmount?: number;
    numberOfRooms?: number;
    timeline?: Array<{
        status: string;
        timestamp: any;
        updatedBy?: string;
        note?: string;
    }>;
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

        // Fetch from the new estimates subcollection
        const estimatesRef = collection(db, `tenants/${tenantId}/estimates`);
        // We might want to order by createdAt desc
        const q = query(estimatesRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const ordersData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        // Map new fields to legacy fields for backward compatibility in UI where consistent
                        clientName: data.customerInfo?.name,
                        clientPhone: data.customerInfo?.phone,
                        clientEmail: data.customerInfo?.email,
                        estimatedAmount: data.totalAmount,
                        // Default status if not present (estimates might not have status initially, default to pending)
                        status: data.status || 'pending'
                    };
                }) as Order[];

                setOrders(ordersData);

                // Calculate stats
                const pendingCount = ordersData.filter(o => o.status === "pending").length;
                const approvedCount = ordersData.filter(o => o.status === "approved").length;
                const rejectedCount = ordersData.filter(o => o.status === "rejected").length;
                const totalValue = ordersData.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

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
        if (!tenantId) return false;
        try {
            const orderRef = doc(db, `tenants/${tenantId}/estimates`, orderId);
            await updateDoc(orderRef, { status });
            return true;
        } catch (error) {
            console.error("Error updating order status:", error);
            return false;
        }
    };

    const updateOrderDetails = async (orderId: string, updates: Partial<Order>) => {
        if (!tenantId) return false;
        try {
            const orderRef = doc(db, `tenants/${tenantId}/estimates`, orderId);
            // We need to be careful with nested updates. For now assuming shallow updates or properly structured
            await updateDoc(orderRef, updates);
            return true;
        } catch (error) {
            console.error("Error updating order details:", error);
            return false;
        }
    };

    return { orders, stats, loading, updateOrderStatus, updateOrderDetails };
}
