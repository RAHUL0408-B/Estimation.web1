"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

export interface PricingRule {
    id: string;
    name: string;
    rate: number;
    enabled: boolean;
}

export interface MultiplierRule {
    id: string;
    name: string;
    multiplier: number;
    enabled?: boolean;
}

export interface LivingAreaOption {
    enabled: boolean;
    price: number;
}

export interface KitchenWoodType {
    id: string;
    name: string;
    multiplier: number;
    enabled: boolean;
}

export interface KitchenLayout {
    id: string;
    name: string;
    basePrice: number;
    enabled: boolean;
}

export interface KitchenAddOn {
    id: string;
    name: string;
    price: number;
    enabled: boolean;
}

export interface BedroomCount {
    count: number;
    basePrice: number;
    enabled: boolean;
}

export interface PricingConfig {
    roomPricing: PricingRule[];
    materialGrades: MultiplierRule[];
    finishTypes: MultiplierRule[];

    // New configuration sections (optional for backward compatibility)
    livingArea?: {
        tvUnit: LivingAreaOption;
        sofaUnit: LivingAreaOption;
        showcase: LivingAreaOption;
        wallPanel: LivingAreaOption;
        falseCeiling: LivingAreaOption;
    };

    kitchen?: {
        woodTypes: KitchenWoodType[];
        layouts: KitchenLayout[];
        addOns: KitchenAddOn[];
    };

    bedrooms?: {
        counts: BedroomCount[];
        masterBedroom: {
            enabled: boolean;
            additionalPrice: number;
        };
        wardrobe: {
            enabled: boolean;
            pricePerBedroom: number;
        };
        studyUnit: {
            enabled: boolean;
            pricePerUnit: number;
        };
    };

    lastUpdated: any;
}

export function usePricingConfig(tenantId: string | null) {
    const [config, setConfig] = useState<PricingConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        const configRef = doc(db, "pricing_configs", tenantId);

        const unsubscribe = onSnapshot(configRef, (snapshot) => {
            if (snapshot.exists()) {
                setConfig(snapshot.data() as PricingConfig);
            } else {
                // Initialize default config if none exists
                const defaultConfig: PricingConfig = {
                    roomPricing: [
                        { id: "1", name: "Master Bedroom", rate: 150000, enabled: true },
                        { id: "2", name: "Kitchen", rate: 250000, enabled: true },
                        { id: "3", name: "Living Room", rate: 180000, enabled: true },
                        { id: "4", name: "Wardrobe", rate: 85000, enabled: true },
                    ],
                    materialGrades: [
                        { id: "m1", name: "HDHMR", multiplier: 1.5, enabled: true },
                        { id: "m2", name: "MDF", multiplier: 1.2, enabled: true },
                        { id: "m3", name: "Plywood", multiplier: 1.3, enabled: true },
                    ],
                    finishTypes: [
                        { id: "f1", name: "PU Paint", multiplier: 1.8, enabled: true },
                        { id: "f2", name: "Laminate", multiplier: 1.2, enabled: true },
                        { id: "f3", name: "Veneer", multiplier: 1.5, enabled: true },
                    ],
                    lastUpdated: serverTimestamp()
                };
                setDoc(configRef, defaultConfig);
                setConfig(defaultConfig);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [tenantId]);

    const saveConfig = async (newConfig: PricingConfig) => {
        if (!tenantId) return;
        try {
            const configRef = doc(db, "pricing_configs", tenantId);
            await setDoc(configRef, {
                ...newConfig,
                lastUpdated: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Error saving pricing config:", error);
            return false;
        }
    };

    return { config, loading, saveConfig };
}
