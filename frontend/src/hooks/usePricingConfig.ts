"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

// New three-tier pricing structure
export interface PricingItem {
    id: string;
    name: string;
    type: 'fixed' | 'perUnit' | 'perSqft';
    basicPrice: number;
    standardPrice: number;
    luxePrice: number;
    enabled: boolean;
}

export interface Category {
    id: string;
    name: string;
    type?: 'residential' | 'commercial';
    order: number;
    items: PricingItem[];
}

export interface DropdownOption {
    id: string;
    name: string;
    enabled: boolean;
}

export interface PricingConfig {
    // New structure
    categories?: Category[];
    kitchenLayouts?: DropdownOption[];
    kitchenMaterials?: DropdownOption[];

    // Legacy fields (for backward compatibility during migration)
    roomPricing?: PricingRule[];
    materialGrades?: MultiplierRule[];
    finishTypes?: MultiplierRule[];
    livingArea?: {
        [key: string]: LivingAreaOption;
    };
    kitchen?: {
        woodTypes: KitchenWoodType[];
        layouts: KitchenLayout[];
        addOns: KitchenAddOn[];
    };
    bedrooms?: {
        counts: BedroomCount[];
        [key: string]: any;
    };

    lastUpdated: any;
}

// Legacy interfaces (kept for backward compatibility)
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

// Migration helper: Convert legacy config to new format
function migrateLegacyConfig(oldConfig: PricingConfig): PricingConfig {
    const categories: Category[] = [];
    let order = 0;

    // Migrate Living Area
    if (oldConfig.livingArea) {
        const livingAreaItems: PricingItem[] = Object.entries(oldConfig.livingArea).map(([key, option]) => ({
            id: `la_${key}`,
            name: key.replace(/([A-Z])/g, ' $1').trim(),
            type: 'fixed' as const,
            basicPrice: Math.round(option.price * 0.8),
            standardPrice: option.price,
            luxePrice: Math.round(option.price * 1.2),
            enabled: option.enabled
        }));

        if (livingAreaItems.length > 0) {
            categories.push({
                id: 'living_area',
                name: 'Living Area',
                order: order++,
                items: livingAreaItems
            });
        }
    }

    // Migrate Kitchen Add-ons
    if (oldConfig.kitchen?.addOns) {
        const kitchenItems: PricingItem[] = oldConfig.kitchen.addOns.map(addon => ({
            id: addon.id,
            name: addon.name,
            type: 'perUnit' as const,
            basicPrice: Math.round(addon.price * 0.8),
            standardPrice: addon.price,
            luxePrice: Math.round(addon.price * 1.2),
            enabled: addon.enabled
        }));

        categories.push({
            id: 'kitchen_addons',
            name: 'Kitchen Add-ons',
            order: order++,
            items: kitchenItems
        });
    }

    // Migrate Bedrooms
    if (oldConfig.bedrooms) {
        const bedroomItems: PricingItem[] = [];

        // Add bedroom count options as items
        if (oldConfig.bedrooms.counts) {
            oldConfig.bedrooms.counts.forEach(bc => {
                bedroomItems.push({
                    id: `br_count_${bc.count}`,
                    name: `${bc.count} Bedroom(s)`,
                    type: 'fixed' as const,
                    basicPrice: Math.round(bc.basePrice * 0.8),
                    standardPrice: bc.basePrice,
                    luxePrice: Math.round(bc.basePrice * 1.2),
                    enabled: bc.enabled
                });
            });
        }

        // Add bedroom options
        if (oldConfig.bedrooms.masterBedroom) {
            bedroomItems.push({
                id: 'br_master',
                name: 'Master Bedroom',
                type: 'fixed' as const,
                basicPrice: Math.round((oldConfig.bedrooms.masterBedroom as any).additionalPrice * 0.8),
                standardPrice: (oldConfig.bedrooms.masterBedroom as any).additionalPrice,
                luxePrice: Math.round((oldConfig.bedrooms.masterBedroom as any).additionalPrice * 1.2),
                enabled: oldConfig.bedrooms.masterBedroom.enabled
            });
        }

        if (oldConfig.bedrooms.wardrobe) {
            bedroomItems.push({
                id: 'br_wardrobe',
                name: 'Wardrobe',
                type: 'perUnit' as const,
                basicPrice: Math.round((oldConfig.bedrooms.wardrobe as any).pricePerBedroom * 0.8),
                standardPrice: (oldConfig.bedrooms.wardrobe as any).pricePerBedroom,
                luxePrice: Math.round((oldConfig.bedrooms.wardrobe as any).pricePerBedroom * 1.2),
                enabled: oldConfig.bedrooms.wardrobe.enabled
            });
        }

        if (bedroomItems.length > 0) {
            categories.push({
                id: 'bedroom',
                name: 'Bedroom',
                order: order++,
                items: bedroomItems
            });
        }
    }

    // Create kitchen layouts from old kitchen layouts
    const kitchenLayouts: DropdownOption[] = oldConfig.kitchen?.layouts.map(layout => ({
        id: layout.id,
        name: layout.name,
        enabled: layout.enabled
    })) || [
            { id: 'kl1', name: 'L-Shape', enabled: true },
            { id: 'kl2', name: 'U-Shape', enabled: true },
            { id: 'kl3', name: 'Parallel', enabled: true },
            { id: 'kl4', name: 'Island', enabled: true }
        ];

    // Create kitchen materials from old wood types
    const kitchenMaterials: DropdownOption[] = oldConfig.kitchen?.woodTypes.map(wt => ({
        id: wt.id,
        name: wt.name,
        enabled: wt.enabled
    })) || [
            { id: 'wt1', name: 'Marine Ply', enabled: true },
            { id: 'wt2', name: 'BWP Ply', enabled: true },
            { id: 'wt3', name: 'HDHMR', enabled: true }
        ];

    return {
        categories,
        kitchenLayouts,
        kitchenMaterials,
        lastUpdated: serverTimestamp()
    };
}

// Create default new format config
function createDefaultConfig(): PricingConfig {
    return {
        categories: [
            // Residential Categories
            {
                id: 'living_area',
                name: 'Living Area',
                type: 'residential',
                order: 0,
                items: [
                    { id: 'la_1', name: 'TV Unit', type: 'fixed', basicPrice: 28000, standardPrice: 35000, luxePrice: 42000, enabled: true },
                    { id: 'la_2', name: 'Sofa Unit', type: 'fixed', basicPrice: 36000, standardPrice: 45000, luxePrice: 54000, enabled: true },
                    { id: 'la_3', name: 'Showcase', type: 'fixed', basicPrice: 22400, standardPrice: 28000, luxePrice: 33600, enabled: true },
                    { id: 'la_4', name: 'Wall Panel', type: 'perSqft', basicPrice: 400, standardPrice: 500, luxePrice: 600, enabled: true },
                    { id: 'la_5', name: 'False Ceiling', type: 'perSqft', basicPrice: 280, standardPrice: 350, luxePrice: 420, enabled: true }
                ]
            },
            {
                id: 'kitchen',
                name: 'Kitchen',
                type: 'residential',
                order: 1,
                items: [
                    { id: 'k_1', name: 'Tandem Drawers', type: 'perUnit', basicPrice: 12000, standardPrice: 15000, luxePrice: 18000, enabled: true },
                    { id: 'k_2', name: 'Tall Unit', type: 'perUnit', basicPrice: 20000, standardPrice: 25000, luxePrice: 30000, enabled: true },
                    { id: 'k_3', name: 'Corner Carousel', type: 'perUnit', basicPrice: 9600, standardPrice: 12000, luxePrice: 14400, enabled: true },
                    { id: 'k_4', name: 'Built-in Appliances', type: 'perUnit', basicPrice: 36000, standardPrice: 45000, luxePrice: 54000, enabled: true }
                ]
            },
            {
                id: 'bedroom',
                name: 'Bedroom',
                type: 'residential',
                order: 2,
                items: [
                    { id: 'br_1', name: 'Wardrobe', type: 'perUnit', basicPrice: 36000, standardPrice: 45000, luxePrice: 54000, enabled: true },
                    { id: 'br_2', name: 'Bed with Storage', type: 'perUnit', basicPrice: 24000, standardPrice: 30000, luxePrice: 36000, enabled: true },
                    { id: 'br_3', name: 'Study Unit', type: 'perUnit', basicPrice: 22400, standardPrice: 28000, luxePrice: 33600, enabled: true },
                    { id: 'br_4', name: 'Dressing Table', type: 'perUnit', basicPrice: 16000, standardPrice: 20000, luxePrice: 24000, enabled: true }
                ]
            },
            // Commercial Categories
            {
                id: 'office_space',
                name: 'Office Space',
                type: 'commercial',
                order: 3,
                items: [
                    { id: 'off_1', name: 'Reception Desk', type: 'fixed', basicPrice: 45000, standardPrice: 60000, luxePrice: 75000, enabled: true },
                    { id: 'off_2', name: 'Conference Table', type: 'fixed', basicPrice: 50000, standardPrice: 70000, luxePrice: 90000, enabled: true },
                    { id: 'off_3', name: 'Modular Workstation', type: 'perUnit', basicPrice: 12000, standardPrice: 15000, luxePrice: 18000, enabled: true },
                    { id: 'off_4', name: 'Executive Chair', type: 'perUnit', basicPrice: 8000, standardPrice: 12000, luxePrice: 16000, enabled: true }
                ]
            },
            {
                id: 'retail_shop',
                name: 'Retail Shop',
                type: 'commercial',
                order: 4,
                items: [
                    { id: 'ret_1', name: 'Display Racks', type: 'perUnit', basicPrice: 15000, standardPrice: 20000, luxePrice: 25000, enabled: true },
                    { id: 'ret_2', name: 'Billing Counter', type: 'fixed', basicPrice: 30000, standardPrice: 45000, luxePrice: 60000, enabled: true },
                    { id: 'ret_3', name: 'Trial Room', type: 'perUnit', basicPrice: 20000, standardPrice: 25000, luxePrice: 30000, enabled: true }
                ]
            },
            {
                id: 'cabin',
                name: 'Cabin',
                type: 'commercial',
                order: 5,
                items: [
                    { id: 'cb_1', name: 'Executive Desk', type: 'perUnit', basicPrice: 25000, standardPrice: 35000, luxePrice: 45000, enabled: true },
                    { id: 'cb_2', name: 'Credenza/Storage', type: 'perUnit', basicPrice: 15000, standardPrice: 20000, luxePrice: 25000, enabled: true },
                    { id: 'cb_3', name: 'Visitor Chairs (Set of 2)', type: 'perUnit', basicPrice: 12000, standardPrice: 18000, luxePrice: 24000, enabled: true },
                    { id: 'cb_4', name: 'Wall Panelling', type: 'perSqft', basicPrice: 450, standardPrice: 600, luxePrice: 800, enabled: true }
                ]
            },
            {
                id: 'commercial_bathroom',
                name: 'Bathroom',
                type: 'commercial',
                order: 6,
                items: [
                    { id: 'cbth_1', name: 'Toilet Partition', type: 'perUnit', basicPrice: 18000, standardPrice: 24000, luxePrice: 30000, enabled: true },
                    { id: 'cbth_2', name: 'Vanity with Mirror', type: 'perUnit', basicPrice: 20000, standardPrice: 28000, luxePrice: 36000, enabled: true },
                    { id: 'cbth_3', name: 'Hand Dryer', type: 'perUnit', basicPrice: 8000, standardPrice: 12000, luxePrice: 16000, enabled: true }
                ]
            }
        ],
        kitchenLayouts: [
            { id: 'kl1', name: 'L-Shape', enabled: true },
            { id: 'kl2', name: 'U-Shape', enabled: true },
            { id: 'kl3', name: 'Parallel', enabled: true },
            { id: 'kl4', name: 'Island', enabled: true },
            { id: 'kl5', name: 'Straight', enabled: true }
        ],
        kitchenMaterials: [
            { id: 'km1', name: 'Marine Ply', enabled: true },
            { id: 'km2', name: 'BWP Ply', enabled: true },
            { id: 'km3', name: 'HDHMR', enabled: true },
            { id: 'km4', name: 'MDF', enabled: true },
            { id: 'km5', name: 'Plywood', enabled: true }
        ],
        lastUpdated: serverTimestamp()
    };
}

export function usePricingConfig(tenantId: string | null) {
    const [config, setConfig] = useState<PricingConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const configRef = doc(db, "pricing_configs", tenantId);

        const unsubscribe = onSnapshot(configRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as PricingConfig;

                // Migration check - if it's old format, we just set it and let the component handle it
                if (!data.categories && (data.roomPricing || data.livingArea || data.kitchen || data.bedrooms)) {
                    console.log("Legacy pricing config detected...");
                    const migrated = migrateLegacyConfig(data);
                    setConfig(migrated);
                } else if (!data.categories || data.categories.length === 0) {
                    // No categories or empty array, use default to avoid blank UI
                    console.log("No categories found, using default config");
                    setConfig(createDefaultConfig());
                } else {
                    setConfig(data);
                }
            } else {
                // Initialize default config if none exists
                setConfig(createDefaultConfig());
            }
            setLoading(false);
        }, (err) => {
            console.error("Pricing config listener error:", err);
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
