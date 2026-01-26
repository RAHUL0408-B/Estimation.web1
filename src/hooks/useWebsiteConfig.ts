"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface WebsiteConfig {
    brandName: string;
    headerTitle: string;
    phone: string;
    email: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    heroImageUrl: string;
    heroHeading: string;
    heroSubheading: string;
    footerText: string;
    updatedAt?: any;
}

const defaultConfig: WebsiteConfig = {
    brandName: "",
    headerTitle: "",
    phone: "",
    email: "",
    primaryColor: "#ea580c",
    secondaryColor: "#1c1917",
    logoUrl: "",
    heroImageUrl: "",
    heroHeading: "Design your dream home with perfection.",
    heroSubheading: "From modular kitchens to complete home renovations, we bring luxury and functionality together.",
    footerText: "Transforming spaces into dreams.",
};

export function useWebsiteConfig(tenantId: string | null) {
    const [config, setConfig] = useState<WebsiteConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Real-time listener
    useEffect(() => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        const configRef = doc(db, "tenants", tenantId, "websiteConfig", "settings");

        const unsubscribe = onSnapshot(
            configRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setConfig({ ...defaultConfig, ...snapshot.data() } as WebsiteConfig);
                } else {
                    setConfig(defaultConfig);
                }
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching website config:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [tenantId]);

    // Save config
    const saveConfig = async (updates: Partial<WebsiteConfig>) => {
        if (!tenantId) return false;

        setSaving(true);
        try {
            const configRef = doc(db, "tenants", tenantId, "websiteConfig", "settings");
            await setDoc(configRef, {
                ...config,
                ...updates,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            return true;
        } catch (error) {
            console.error("Error saving website config:", error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Upload image
    const uploadImage = async (file: File, type: "logo" | "hero"): Promise<string | null> => {
        if (!tenantId) return null;

        try {
            const path = `tenants/${tenantId}/website/${type}_${Date.now()}`;
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            // Auto-save URL
            const field = type === "logo" ? "logoUrl" : "heroImageUrl";
            await saveConfig({ [field]: url });

            return url;
        } catch (error) {
            console.error("Error uploading image:", error);
            return null;
        }
    };

    return {
        config,
        loading,
        saving,
        saveConfig,
        uploadImage,
    };
}

// Public hook - for storefront (no auth required)
export function usePublicWebsiteConfig(storeSlug: string) {
    const [config, setConfig] = useState<WebsiteConfig | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Resolve slug to tenant ID
    useEffect(() => {
        if (!storeSlug) {
            setLoading(false);
            return;
        }

        const resolveTenant = async () => {
            try {
                const { getTenantByStoreId } = await import("@/lib/firestoreHelpers");
                const tenant = await getTenantByStoreId(storeSlug);
                if (tenant) {
                    setTenantId(tenant.id);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error resolving tenant:", error);
                setLoading(false);
            }
        };

        resolveTenant();
    }, [storeSlug]);

    // Real-time config listener
    useEffect(() => {
        if (!tenantId) return;

        const configRef = doc(db, "tenants", tenantId, "websiteConfig", "settings");

        const unsubscribe = onSnapshot(
            configRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setConfig({ ...defaultConfig, ...snapshot.data() } as WebsiteConfig);
                } else {
                    setConfig(defaultConfig);
                }
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching public config:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [tenantId]);

    return { config, tenantId, loading };
}
