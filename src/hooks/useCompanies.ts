"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Tenant } from "@/lib/firestoreHelpers";

export function useCompanies() {
    const [companies, setCompanies] = useState<Tenant[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<Tenant[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tenantsRef = collection(db, "tenants");
        const q = query(tenantsRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const companyList: Tenant[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                companyList.push({ id: doc.id, ...data } as Tenant);
            });

            setCompanies(companyList);
            setFilteredCompanies(companyList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter companies based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredCompanies(companies);
            return;
        }

        const searchLower = searchQuery.toLowerCase();
        const filtered = companies.filter(
            (company) =>
                company.name.toLowerCase().includes(searchLower) ||
                company.email.toLowerCase().includes(searchLower) ||
                company.businessName.toLowerCase().includes(searchLower) ||
                company.storeId.toLowerCase().includes(searchLower)
        );

        setFilteredCompanies(filtered);
    }, [searchQuery, companies]);

    return {
        companies: filteredCompanies,
        loading,
        searchQuery,
        setSearchQuery,
        totalCount: companies.length,
        filteredCount: filteredCompanies.length,
    };
}
