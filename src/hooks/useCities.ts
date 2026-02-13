"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";

export interface City {
    id: string;
    name: string;
    enabled: boolean;
    tier?: 'Tier 1' | 'Tier 2' | 'Tier 3'; // Optional for future pricing logic
    createdAt?: any;
}

export function useCities(tenantId: string | null) {
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        const citiesRef = collection(db, "tenants", tenantId, "cities");
        const q = query(citiesRef, orderBy("name", "asc"));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const cityData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as City[];
                setCities(cityData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching cities:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [tenantId]);

    const addCity = async (name: string): Promise<boolean> => {
        if (!tenantId) return false;
        setSaving(true);
        try {
            await addDoc(collection(db, "tenants", tenantId, "cities"), {
                name,
                enabled: true,
                createdAt: serverTimestamp(),
            });
            return true;
        } catch (error) {
            console.error("Error adding city:", error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const updateCity = async (id: string, updates: Partial<City>): Promise<boolean> => {
        if (!tenantId) return false;
        setSaving(true);
        try {
            await updateDoc(doc(db, "tenants", tenantId, "cities", id), updates);
            return true;
        } catch (error) {
            console.error("Error updating city:", error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const deleteCity = async (id: string): Promise<boolean> => {
        if (!tenantId) return false;
        setSaving(true);
        try {
            await deleteDoc(doc(db, "tenants", tenantId, "cities", id));
            return true;
        } catch (error) {
            console.error("Error deleting city:", error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const toggleCity = async (id: string, currentStatus: boolean): Promise<boolean> => {
        return updateCity(id, { enabled: !currentStatus });
    };

    return {
        cities,
        loading,
        saving,
        addCity,
        updateCity,
        deleteCity,
        toggleCity
    };
}
