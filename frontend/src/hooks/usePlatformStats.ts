"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, Timestamp } from "@/lib/firebaseWrapper";
import { Tenant, calculateGrowthRate } from "@/lib/firestoreHelpers";

export interface PlatformStats {
    totalCompanies: number;
    activeCompanies: number;
    platformRevenue: number;
    growthRate: number;
    companiesLastMonth: number;
    companiesThisMonth: number;
    revenueLastMonth: number;
    loading: boolean;
}

export function usePlatformStats(): PlatformStats {
    const [stats, setStats] = useState<PlatformStats>({
        totalCompanies: 0,
        activeCompanies: 0,
        platformRevenue: 0,
        growthRate: 0,
        companiesLastMonth: 0,
        companiesThisMonth: 0,
        revenueLastMonth: 0,
        loading: true,
    });

    useEffect(() => {
        const tenantsRef = collection(db, "tenants");

        // Listen to all tenants (companies) in real-time
        const unsubscribe = onSnapshot(tenantsRef, (snapshot) => {
            const companies: Tenant[] = [];

            snapshot.forEach((doc) => {
                companies.push({ id: doc.id, ...doc.data() } as Tenant);
            });

            // Calculate total companies (all statuses except rejected)
            const totalCompanies = companies.filter(
                (c) => c.status !== "rejected"
            ).length;

            // Calculate active companies (companies with at least one estimate)
            const activeCompanies = companies.filter(
                (c) => c.status === "active" && c.activatedAt
            ).length;

            // Calculate platform revenue (sum of all active company revenues)
            const platformRevenue = companies
                .filter((c) => c.status === "active")
                .reduce((sum, c) => sum + (c.revenue?.thisMonth || 0), 0);

            // Calculate last month revenue
            const revenueLastMonth = companies
                .filter((c) => c.status === "active")
                .reduce((sum, c) => sum + (c.revenue?.lastMonth || 0), 0);

            // Calculate companies from last month (for comparison)
            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

            const companiesLastMonth = companies.filter((c) => {
                if (!c.createdAt?.toDate) return false;
                const createdDate = c.createdAt.toDate();
                return createdDate < startOfThisMonth;
            }).length;

            // Calculate companies registered this month
            const companiesThisMonth = companies.filter((c) => {
                if (!c.createdAt?.toDate) return false;
                const createdDate = c.createdAt.toDate();
                return createdDate >= startOfThisMonth;
            }).length;

            // Calculate growth rate (company onboarding growth)
            const growthRate = companiesLastMonth > 0
                ? ((totalCompanies - companiesLastMonth) / companiesLastMonth) * 100
                : totalCompanies > 0 ? 100 : 0;

            setStats({
                totalCompanies,
                activeCompanies,
                platformRevenue,
                growthRate,
                companiesLastMonth,
                companiesThisMonth,
                revenueLastMonth,
                loading: false,
            });
        });

        return () => unsubscribe();
    }, []);

    return stats;
}
