"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { Tenant } from "@/lib/firestoreHelpers";

export interface RecentOrder {
    id: string;
    estimateId: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    carpetArea?: number;
    numberOfRooms?: number;
    rooms?: string[];
    selectedRooms?: string[]; // Legacy field
    materialGrade?: string;
    finishType?: string;
    estimatedAmount?: number;
    status: "pending" | "approved" | "rejected" | "generated";
    createdAt: any;
    pdfUrl?: string;
}

export interface TenantDashboardStats {
    revenue: {
        total: number;
        thisMonth: number;
        lastMonth: number;
        growth: number;
    };
    subscription: {
        plan: string;
        status: string;
    };
    estimatesCount: number;
    ordersCount: number;
    pendingApprovalsCount: number;
    todayEstimatesCount: number;
    rejectedThisWeekCount: number;
    recentOrders: RecentOrder[];
    loading: boolean;
}

export function useTenantDashboard(tenantId: string | null) {
    const [stats, setStats] = useState<TenantDashboardStats>({
        revenue: {
            total: 0,
            thisMonth: 0,
            lastMonth: 0,
            growth: 0,
        },
        subscription: {
            plan: "free",
            status: "active",
        },
        estimatesCount: 0,
        ordersCount: 0,
        pendingApprovalsCount: 0,
        todayEstimatesCount: 0,
        rejectedThisWeekCount: 0,
        recentOrders: [],
        loading: true,
    });

    useEffect(() => {
        if (!tenantId) {
            setStats(prev => ({ ...prev, loading: false }));
            return;
        }

        const tenantRef = doc(db, "tenants", tenantId);

        // Function to fetch counts and recent items
        const fetchDashboardData = async () => {
            try {
                // Get start of today
                const now = new Date();
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const todayTimestamp = Timestamp.fromDate(startOfToday);

                // Get start of this week (Sunday)
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                const weekTimestamp = Timestamp.fromDate(startOfWeek);

                const [
                    estimatesSnapshot,
                    ordersSnapshot,
                    pendingSnapshot,
                    recentOrdersSnapshot
                ] = await Promise.all([
                    getDocs(query(collection(db, "estimates"), where("tenantId", "==", tenantId))),
                    getDocs(query(collection(db, "orders"), where("tenantId", "==", tenantId))),
                    getDocs(query(
                        collection(db, "orders"),
                        where("tenantId", "==", tenantId),
                        where("status", "==", "pending")
                    )),
                    getDocs(query(
                        collection(db, "orders"),
                        where("tenantId", "==", tenantId)
                    ))
                ]);

                // Process orders for additional stats
                const allOrders = recentOrdersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as RecentOrder[];

                // Sort by createdAt descending
                allOrders.sort((a, b) => {
                    if (!a.createdAt || !b.createdAt) return 0;
                    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                    return bTime - aTime;
                });

                // Get recent 5 orders
                const recentOrders = allOrders.slice(0, 5);

                // Calculate today's estimates count
                const todayEstimatesCount = allOrders.filter(order => {
                    if (!order.createdAt?.toMillis) return false;
                    return order.createdAt.toMillis() >= todayTimestamp.toMillis();
                }).length;

                // Calculate rejected this week count
                const rejectedThisWeekCount = allOrders.filter(order => {
                    if (!order.createdAt?.toMillis) return false;
                    return order.status === "rejected" &&
                           order.createdAt.toMillis() >= weekTimestamp.toMillis();
                }).length;

                return {
                    estimatesCount: estimatesSnapshot.size,
                    ordersCount: ordersSnapshot.size,
                    pendingApprovalsCount: pendingSnapshot.size,
                    todayEstimatesCount,
                    rejectedThisWeekCount,
                    recentOrders
                };
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                return {
                    estimatesCount: 0,
                    ordersCount: 0,
                    pendingApprovalsCount: 0,
                    todayEstimatesCount: 0,
                    rejectedThisWeekCount: 0,
                    recentOrders: []
                };
            }
        };

        const unsubscribe = onSnapshot(tenantRef, async (snapshot) => {
            if (!snapshot.exists()) {
                setStats(prev => ({ ...prev, loading: false }));
                return;
            }

            const data = snapshot.data() as Tenant;

            // Calculate growth percentage
            const growth = data.revenue?.lastMonth
                ? ((data.revenue.thisMonth - data.revenue.lastMonth) / data.revenue.lastMonth) * 100
                : 0;

            const extraData = await fetchDashboardData();

            setStats({
                revenue: {
                    total: data.revenue?.total || 0,
                    thisMonth: data.revenue?.thisMonth || 0,
                    lastMonth: data.revenue?.lastMonth || 0,
                    growth,
                },
                subscription: {
                    plan: data.subscription?.plan || "free",
                    status: data.subscription?.status || "active",
                },
                estimatesCount: extraData.estimatesCount,
                ordersCount: extraData.ordersCount,
                pendingApprovalsCount: extraData.pendingApprovalsCount,
                todayEstimatesCount: extraData.todayEstimatesCount,
                rejectedThisWeekCount: extraData.rejectedThisWeekCount,
                recentOrders: extraData.recentOrders,
                loading: false,
            });
        });

        return () => unsubscribe();
    }, [tenantId]);

    return stats;
}
