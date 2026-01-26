"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Save,
    RefreshCcw,
    Info,
    X,
    Home,
    Utensils,
    Bed,
    Pencil,
    Trash2
} from "lucide-react";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import {
    usePricingConfig,
    PricingConfig,
    MultiplierRule,
    LivingAreaOption,
    KitchenWoodType,
    KitchenLayout,
    KitchenAddOn,
    BedroomCount
} from "@/hooks/usePricingConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function PricingPage() {
    const { tenant } = useTenantAuth();
    const { config, loading, saveConfig } = usePricingConfig(tenant?.id || null);
    const [localConfig, setLocalConfig] = useState<PricingConfig | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Dialog states
    const [showAddMaterial, setShowAddMaterial] = useState(false);
    const [showAddFinish, setShowAddFinish] = useState(false);
    const [showAddLivingArea, setShowAddLivingArea] = useState(false);
    const [showAddWoodType, setShowAddWoodType] = useState(false);
    const [showAddKitchenLayout, setShowAddKitchenLayout] = useState(false);
    const [showAddKitchenAddon, setShowAddKitchenAddon] = useState(false);
    const [showAddBedroomCount, setShowAddBedroomCount] = useState(false);
    const [showAddBedroomOption, setShowAddBedroomOption] = useState(false);

    // Form states
    const [newMaterialName, setNewMaterialName] = useState("");
    const [newMaterialMultiplier, setNewMaterialMultiplier] = useState("");
    const [newFinishName, setNewFinishName] = useState("");
    const [newFinishMultiplier, setNewFinishMultiplier] = useState("");
    const [newLivingAreaName, setNewLivingAreaName] = useState("");
    const [newLivingAreaPrice, setNewLivingAreaPrice] = useState("");
    const [newWoodTypeName, setNewWoodTypeName] = useState("");
    const [newWoodTypeMultiplier, setNewWoodTypeMultiplier] = useState("");
    const [newKitchenLayoutName, setNewKitchenLayoutName] = useState("");
    const [newKitchenLayoutPrice, setNewKitchenLayoutPrice] = useState("");
    const [newKitchenAddonName, setNewKitchenAddonName] = useState("");
    const [newKitchenAddonPrice, setNewKitchenAddonPrice] = useState("");
    const [newBedroomCount, setNewBedroomCount] = useState("");
    const [newBedroomPrice, setNewBedroomPrice] = useState("");
    const [newBedroomOptionName, setNewBedroomOptionName] = useState("");
    const [newBedroomOptionPrice, setNewBedroomOptionPrice] = useState("");

    // Edit states
    const [editingLivingArea, setEditingLivingArea] = useState<string | null>(null);
    const [editingKitchenItem, setEditingKitchenItem] = useState<string | null>(null);
    const [editingBedroomOption, setEditingBedroomOption] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        if (config) {
            const configCopy = JSON.parse(JSON.stringify(config));

            // Initialize new sections if they don't exist
            if (!configCopy.livingArea) {
                configCopy.livingArea = {
                    tvUnit: { enabled: true, price: 35000 },
                    sofaUnit: { enabled: true, price: 45000 },
                    showcase: { enabled: true, price: 28000 },
                    wallPanel: { enabled: true, price: 22000 },
                    falseCeiling: { enabled: true, price: 18000 }
                };
            }

            if (!configCopy.kitchen) {
                configCopy.kitchen = {
                    woodTypes: [
                        { id: "wt1", name: "Marine Ply", multiplier: 1.5, enabled: true },
                        { id: "wt2", name: "BWP Ply", multiplier: 1.3, enabled: true },
                        { id: "wt3", name: "HDHMR", multiplier: 1.2, enabled: true }
                    ],
                    layouts: [
                        { id: "kl1", name: "L-Shape", basePrice: 180000, enabled: true },
                        { id: "kl2", name: "U-Shape", basePrice: 250000, enabled: true },
                        { id: "kl3", name: "Parallel", basePrice: 200000, enabled: true },
                        { id: "kl4", name: "Island", basePrice: 350000, enabled: true }
                    ],
                    addOns: [
                        { id: "ka1", name: "Tandem Drawers", price: 15000, enabled: true },
                        { id: "ka2", name: "Tall Unit", price: 25000, enabled: true },
                        { id: "ka3", name: "Corner Carousel", price: 12000, enabled: true },
                        { id: "ka4", name: "Built-in Appliances", price: 45000, enabled: true }
                    ]
                };
            }

            if (!configCopy.bedrooms) {
                configCopy.bedrooms = {
                    counts: [
                        { count: 1, basePrice: 120000, enabled: true },
                        { count: 2, basePrice: 220000, enabled: true },
                        { count: 3, basePrice: 310000, enabled: true }
                    ],
                    masterBedroom: { enabled: true, additionalPrice: 35000 },
                    wardrobe: { enabled: true, pricePerBedroom: 45000 },
                    studyUnit: { enabled: true, pricePerUnit: 28000 }
                };
            }

            setLocalConfig(configCopy);
        }
    }, [config]);

    const handleSave = async () => {
        if (!localConfig) return;
        setIsSaving(true);
        const success = await saveConfig(localConfig);
        if (success) {
            alert("✅ Pricing configuration saved successfully!");
        }
        setIsSaving(false);
    };

    // Living Area handlers
    type LivingAreaKey = "tvUnit" | "sofaUnit" | "showcase" | "wallPanel" | "falseCeiling";

    const updateLivingAreaPrice = (key: LivingAreaKey, price: number) => {
        if (!localConfig?.livingArea) return;
        setLocalConfig({
            ...localConfig,
            livingArea: {
                ...localConfig.livingArea,
                [key]: { ...localConfig.livingArea[key], price }
            }
        });
    };

    const toggleLivingAreaOption = (key: string) => {
        if (!localConfig?.livingArea) return;
        setLocalConfig({
            ...localConfig,
            livingArea: {
                ...localConfig.livingArea,
                [key]: { ...localConfig.livingArea[key], enabled: !localConfig.livingArea[key].enabled }
            }
        });
    };

    const addLivingAreaOption = () => {
        if (!localConfig?.livingArea || !newLivingAreaName || !newLivingAreaPrice) return;
        const key = newLivingAreaName.toLowerCase().replace(/\s+/g, '');
        setLocalConfig({
            ...localConfig,
            livingArea: {
                ...localConfig.livingArea,
                [key]: { enabled: true, price: parseInt(newLivingAreaPrice) }
            }
        });
        setNewLivingAreaName("");
        setNewLivingAreaPrice("");
        setShowAddLivingArea(false);
    };

    const deleteLivingAreaOption = (key: string) => {
        if (!localConfig?.livingArea) return;
        const newLivingArea = { ...localConfig.livingArea };
        delete newLivingArea[key];
        setLocalConfig({
            ...localConfig,
            livingArea: newLivingArea
        });
    };

    const updateLivingAreaName = (oldKey: string, newName: string) => {
        if (!localConfig?.livingArea) return;
        const newKey = newName.toLowerCase().replace(/\s+/g, '');
        if (oldKey === newKey) {
            setEditingLivingArea(null);
            return;
        }
        const oldOption = localConfig.livingArea[oldKey];
        const newLivingArea = { ...localConfig.livingArea };
        delete newLivingArea[oldKey];
        newLivingArea[newKey] = oldOption;
        setLocalConfig({
            ...localConfig,
            livingArea: newLivingArea
        });
        setEditingLivingArea(null);
    };

    // Kitchen handlers
    const updateKitchenWoodType = (id: string, field: 'multiplier', value: number) => {
        if (!localConfig?.kitchen) return;
        setLocalConfig({
            ...localConfig,
            kitchen: {
                ...localConfig.kitchen,
                woodTypes: localConfig.kitchen.woodTypes.map(wt =>
                    wt.id === id ? { ...wt, [field]: value } : wt
                )
            }
        });
    };

    const updateKitchenLayout = (id: string, field: 'basePrice', value: number) => {
        if (!localConfig?.kitchen) return;
        setLocalConfig({
            ...localConfig,
            kitchen: {
                ...localConfig.kitchen,
                layouts: localConfig.kitchen.layouts.map(layout =>
                    layout.id === id ? { ...layout, [field]: value } : layout
                )
            }
        });
    };

    const updateKitchenAddOn = (id: string, field: 'price', value: number) => {
        if (!localConfig?.kitchen) return;
        setLocalConfig({
            ...localConfig,
            kitchen: {
                ...localConfig.kitchen,
                addOns: localConfig.kitchen.addOns.map(addon =>
                    addon.id === id ? { ...addon, [field]: value } : addon
                )
            }
        });
    };

    const toggleKitchenItem = (type: 'woodTypes' | 'layouts' | 'addOns', id: string) => {
        if (!localConfig?.kitchen) return;
        setLocalConfig({
            ...localConfig,
            kitchen: {
                ...localConfig.kitchen,
                [type]: localConfig.kitchen[type].map((item: any) =>
                    item.id === id ? { ...item, enabled: !item.enabled } : item
                )
            }
        });
    };

    const addKitchenWoodType = () => {
        if (!localConfig?.kitchen || !newWoodTypeName || !newWoodTypeMultiplier) return;
        const newItem = {
            id: `wt_${Date.now()}`,
            name: newWoodTypeName,
            multiplier: parseFloat(newWoodTypeMultiplier),
            enabled: true
        };
        setLocalConfig({
            ...localConfig,
            kitchen: {
                ...localConfig.kitchen,
                woodTypes: [...localConfig.kitchen.woodTypes, newItem]
            }
        });
        setNewWoodTypeName("");
        setNewWoodTypeMultiplier("");
        setShowAddWoodType(false);
    };

    const addKitchenLayout = () => {
        if (!localConfig?.kitchen || !newKitchenLayoutName || !newKitchenLayoutPrice) return;
        const newItem = {
            id: `kl_${Date.now()}`,
            name: newKitchenLayoutName,
            basePrice: parseInt(newKitchenLayoutPrice),
            enabled: true
        };
        setLocalConfig({
            ...localConfig,
            kitchen: {
                ...localConfig.kitchen,
                layouts: [...localConfig.kitchen.layouts, newItem]
            }
        });
        setNewKitchenLayoutName("");
        setNewKitchenLayoutPrice("");
        setShowAddKitchenLayout(false);
    };

    const addKitchenAddOn = () => {
        if (!localConfig?.kitchen || !newKitchenAddonName || !newKitchenAddonPrice) return;
        const newItem = {
            id: `ka_${Date.now()}`,
            name: newKitchenAddonName,
            price: parseInt(newKitchenAddonPrice),
            enabled: true
        };
        setLocalConfig({
            ...localConfig,
            kitchen: {
                ...localConfig.kitchen,
                addOns: [...localConfig.kitchen.addOns, newItem]
            }
        });
        setNewKitchenAddonName("");
        setNewKitchenAddonPrice("");
        setShowAddKitchenAddon(false);
    };

    const deleteKitchenItem = (type: 'woodTypes' | 'layouts' | 'addOns', id: string) => {
        if (!localConfig?.kitchen) return;
        setLocalConfig({
            ...localConfig,
            kitchen: {
                ...localConfig.kitchen,
                [type]: localConfig.kitchen[type].filter((item: any) => item.id !== id)
            }
        });
    };

    const updateKitchenItemName = (type: 'woodTypes' | 'layouts' | 'addOns', id: string, newName: string) => {
        if (!localConfig?.kitchen) return;
        setLocalConfig({
            ...localConfig,
            kitchen: {
                ...localConfig.kitchen,
                [type]: localConfig.kitchen[type].map((item: any) =>
                    item.id === id ? { ...item, name: newName } : item
                )
            }
        });
        setEditingKitchenItem(null);
    };

    // Bedroom handlers
    const updateBedroomCount = (count: number, basePrice: number) => {
        if (!localConfig?.bedrooms) return;
        setLocalConfig({
            ...localConfig,
            bedrooms: {
                ...localConfig.bedrooms,
                counts: localConfig.bedrooms.counts.map(bc =>
                    bc.count === count ? { ...bc, basePrice } : bc
                )
            }
        });
    };

    const updateBedroomOption = (option: 'masterBedroom' | 'wardrobe' | 'studyUnit', field: 'additionalPrice' | 'pricePerBedroom' | 'pricePerUnit', value: number) => {
        if (!localConfig?.bedrooms) return;
        setLocalConfig({
            ...localConfig,
            bedrooms: {
                ...localConfig.bedrooms,
                [option]: {
                    ...localConfig.bedrooms[option],
                    [field]: value
                }
            }
        });
    };

    const toggleBedroomOption = (option: 'masterBedroom' | 'wardrobe' | 'studyUnit') => {
        if (!localConfig?.bedrooms) return;
        setLocalConfig({
            ...localConfig,
            bedrooms: {
                ...localConfig.bedrooms,
                [option]: {
                    ...localConfig.bedrooms[option],
                    enabled: !localConfig.bedrooms[option].enabled
                }
            }
        });
    };

    const addBedroomCount = () => {
        if (!localConfig?.bedrooms || !newBedroomCount || !newBedroomPrice) return;
        const count = parseInt(newBedroomCount);
        // Check if count already exists
        if (localConfig.bedrooms.counts.some(bc => bc.count === count)) {
            alert("This bedroom count already exists");
            return;
        }
        const newItem = {
            count: count,
            basePrice: parseInt(newBedroomPrice),
            enabled: true
        };
        setLocalConfig({
            ...localConfig,
            bedrooms: {
                ...localConfig.bedrooms,
                counts: [...localConfig.bedrooms.counts, newItem].sort((a, b) => a.count - b.count)
            }
        });
        setNewBedroomCount("");
        setNewBedroomPrice("");
        setShowAddBedroomCount(false);
    };

    const deleteBedroomCount = (count: number) => {
        if (!localConfig?.bedrooms) return;
        setLocalConfig({
            ...localConfig,
            bedrooms: {
                ...localConfig.bedrooms,
                counts: localConfig.bedrooms.counts.filter(bc => bc.count !== count)
            }
        });
    };

    const toggleBedroomCount = (count: number) => {
        if (!localConfig?.bedrooms) return;
        setLocalConfig({
            ...localConfig,
            bedrooms: {
                ...localConfig.bedrooms,
                counts: localConfig.bedrooms.counts.map(bc =>
                    bc.count === count ? { ...bc, enabled: !bc.enabled } : bc
                )
            }
        });
    };

    // Additional Options handlers
    const addBedroomOption = () => {
        if (!localConfig?.bedrooms || !newBedroomOptionName || !newBedroomOptionPrice) return;
        const key = newBedroomOptionName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        setLocalConfig({
            ...localConfig,
            bedrooms: {
                ...localConfig.bedrooms,
                [key]: { enabled: true, price: parseInt(newBedroomOptionPrice) }
            }
        });
        setNewBedroomOptionName("");
        setNewBedroomOptionPrice("");
        setShowAddBedroomOption(false);
    };

    const deleteBedroomOption = (key: string) => {
        if (!localConfig?.bedrooms) return;
        const newBedrooms = { ...localConfig.bedrooms };
        delete (newBedrooms as any)[key];
        setLocalConfig({
            ...localConfig,
            bedrooms: newBedrooms
        });
    };

    const updateBedroomOptionPrice = (key: string, price: number) => {
        if (!localConfig?.bedrooms) return;
        setLocalConfig({
            ...localConfig,
            bedrooms: {
                ...localConfig.bedrooms,
                [key]: { ...(localConfig.bedrooms as any)[key], price }
            }
        });
    };

    const toggleBedroomOptionEnabled = (key: string) => {
        if (!localConfig?.bedrooms) return;
        const currentOption = (localConfig.bedrooms as any)[key];
        setLocalConfig({
            ...localConfig,
            bedrooms: {
                ...localConfig.bedrooms,
                [key]: { ...currentOption, enabled: !currentOption.enabled }
            }
        });
    };

    const updateBedroomOptionName = (oldKey: string, newName: string) => {
        if (!localConfig?.bedrooms) return;
        const newKey = newName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        if (oldKey === newKey) {
            setEditingBedroomOption(null);
            return;
        }
        const oldOption = (localConfig.bedrooms as any)[oldKey];
        const newBedrooms = { ...localConfig.bedrooms };
        delete (newBedrooms as any)[oldKey];
        (newBedrooms as any)[newKey] = oldOption;
        setLocalConfig({
            ...localConfig,
            bedrooms: newBedrooms
        });
        setEditingBedroomOption(null);
    };

    // Get additional options (exclude counts, masterBedroom, wardrobe, studyUnit which are legacy)
    const getBedroomAdditionalOptions = () => {
        if (!localConfig?.bedrooms) return [];
        const excludeKeys = ['counts', 'masterBedroom', 'wardrobe', 'studyUnit'];
        return Object.entries(localConfig.bedrooms)
            .filter(([key]) => !excludeKeys.includes(key))
            .map(([key, value]) => ({ key, ...(value as any) }));
    };

    const updateMultiplier = (type: 'material' | 'finish', id: string, multiplier: number) => {
        if (!localConfig) return;
        if (type === 'material') {
            setLocalConfig({
                ...localConfig,
                materialGrades: localConfig.materialGrades.map(m => m.id === id ? { ...m, multiplier } : m)
            });
        } else {
            setLocalConfig({
                ...localConfig,
                finishTypes: localConfig.finishTypes.map(f => f.id === id ? { ...f, multiplier } : f)
            });
        }
    };

    const addNewMaterial = () => {
        if (!localConfig || !newMaterialName || !newMaterialMultiplier) return;
        const newMaterial: MultiplierRule = {
            id: `mat_${Date.now()}`,
            name: newMaterialName,
            multiplier: parseFloat(newMaterialMultiplier),
            enabled: true
        };
        setLocalConfig({
            ...localConfig,
            materialGrades: [...localConfig.materialGrades, newMaterial]
        });
        setNewMaterialName("");
        setNewMaterialMultiplier("");
        setShowAddMaterial(false);
    };

    const addNewFinish = () => {
        if (!localConfig || !newFinishName || !newFinishMultiplier) return;
        const newFinish: MultiplierRule = {
            id: `fin_${Date.now()}`,
            name: newFinishName,
            multiplier: parseFloat(newFinishMultiplier),
            enabled: true
        };
        setLocalConfig({
            ...localConfig,
            finishTypes: [...localConfig.finishTypes, newFinish]
        });
        setNewFinishName("");
        setNewFinishMultiplier("");
        setShowAddFinish(false);
    };

    const deleteMaterial = (id: string) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            materialGrades: localConfig.materialGrades.filter(m => m.id !== id)
        });
    };

    const deleteFinish = (id: string) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            finishTypes: localConfig.finishTypes.filter(f => f.id !== id)
        });
    };

    if (loading || !localConfig) {
        return <div className="p-8 text-center text-gray-500">Loading pricing configuration...</div>;
    }

    return (
        <div className="space-y-8 pb-32">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A]">Pricing & Configuration</h1>
                    <p className="text-gray-500 text-sm">Full control over rates used in your public estimation website</p>
                </div>
                <div className="flex items-center space-x-4">
                    {config?.lastUpdated && (
                        <p className="text-[10px] text-gray-400 uppercase font-bold">
                            Last Updated: {config.lastUpdated?.toDate().toLocaleString()}
                        </p>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-6 py-4 rounded-md flex items-center"
                    >
                        <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Pricing Rules"}
                    </Button>
                </div>
            </div>

            {/* Section 1: Living Area Configuration */}
            {localConfig.livingArea && (
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between p-6 border-b">
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 bg-[#0F172A] rounded flex items-center justify-center text-white font-bold text-xs">
                                1
                            </div>
                            <CardTitle className="text-lg font-bold text-[#0F172A]">Living Area Configuration</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-[#0F172A]"
                            onClick={() => setShowAddLivingArea(true)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        {Object.entries(localConfig.livingArea).map(([key, option]) => (
                            <div key={key} className="flex items-center justify-between p-4 border rounded-xl bg-white hover:border-[#0F172A] transition-all group">
                                {editingLivingArea === key ? (
                                    <Input
                                        autoFocus
                                        className="font-bold text-[#0F172A] w-40"
                                        defaultValue={key.replace(/([A-Z])/g, ' $1').trim()}
                                        onBlur={(e) => updateLivingAreaName(key, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                updateLivingAreaName(key, e.currentTarget.value);
                                            } else if (e.key === 'Escape') {
                                                setEditingLivingArea(null);
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-[#0F172A] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600"
                                            onClick={() => {
                                                setEditingLivingArea(key);
                                                setEditName(key.replace(/([A-Z])/g, ' $1').trim());
                                            }}
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                                        <Input
                                            type="number"
                                            className="pl-8 bg-gray-50/50 border-gray-100 font-bold text-[#0F172A] w-32 focus:bg-white"
                                            value={option.price}
                                            onChange={(e) => updateLivingAreaPrice(key as any, parseInt(e.target.value))}
                                        />
                                    </div>
                                    <button
                                        onClick={() => toggleLivingAreaOption(key)}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                            option.enabled ? "bg-[#0F172A]" : "bg-gray-200"
                                        )}
                                    >
                                        <span className={cn(
                                            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                            option.enabled ? "translate-x-5" : "translate-x-0"
                                        )} />
                                    </button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                                        onClick={() => deleteLivingAreaOption(key)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Section 2: Kitchen Configuration */}
            {localConfig.kitchen && (
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between p-6 border-b">
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 bg-[#0F172A] rounded flex items-center justify-center text-white font-bold text-xs">
                                2
                            </div>
                            <CardTitle className="text-lg font-bold text-[#0F172A]">Kitchen Configuration</CardTitle>
                        </div>
                        <Utensils className="h-5 w-5 text-gray-400" />
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        {/* Wood Types */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Wood Types</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-gray-400 hover:text-[#0F172A]"
                                    onClick={() => setShowAddWoodType(true)}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {localConfig.kitchen.woodTypes.map((wt) => (
                                    <div key={wt.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-[#0F172A] transition-all group">
                                        {editingKitchenItem === wt.id ? (
                                            <Input
                                                autoFocus
                                                className="text-sm font-bold text-gray-700 w-32"
                                                defaultValue={wt.name}
                                                onBlur={(e) => updateKitchenItemName('woodTypes', wt.id, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') updateKitchenItemName('woodTypes', wt.id, e.currentTarget.value);
                                                    else if (e.key === 'Escape') setEditingKitchenItem(null);
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-700">{wt.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"
                                                    onClick={() => setEditingKitchenItem(wt.id)}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-2">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                className="h-8 w-20 bg-gray-50/50 border-none font-bold text-[#0F172A] text-right"
                                                value={wt.multiplier}
                                                onChange={(e) => updateKitchenWoodType(wt.id, 'multiplier', parseFloat(e.target.value))}
                                            />
                                            <span className="text-gray-400 text-xs font-bold">x</span>
                                            <button
                                                onClick={() => toggleKitchenItem('woodTypes', wt.id)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                                    wt.enabled ? "bg-[#0F172A]" : "bg-gray-200"
                                                )}
                                            >
                                                <span className={cn(
                                                    "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                                    wt.enabled ? "translate-x-5" : "translate-x-0"
                                                )} />
                                            </button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                                onClick={() => deleteKitchenItem('woodTypes', wt.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Kitchen Layouts */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Kitchen Layouts</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-gray-400 hover:text-[#0F172A]"
                                    onClick={() => setShowAddKitchenLayout(true)}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {localConfig.kitchen.layouts.map((layout) => (
                                    <div key={layout.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-[#0F172A] transition-all group">
                                        {editingKitchenItem === layout.id ? (
                                            <Input
                                                autoFocus
                                                className="text-sm font-bold text-gray-700 w-32"
                                                defaultValue={layout.name}
                                                onBlur={(e) => updateKitchenItemName('layouts', layout.id, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') updateKitchenItemName('layouts', layout.id, e.currentTarget.value);
                                                    else if (e.key === 'Escape') setEditingKitchenItem(null);
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-700">{layout.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"
                                                    onClick={() => setEditingKitchenItem(layout.id)}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-2">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                                                <Input
                                                    type="number"
                                                    className="pl-6 h-8 w-28 bg-gray-50/50 border-none font-bold text-[#0F172A] text-right"
                                                    value={layout.basePrice}
                                                    onChange={(e) => updateKitchenLayout(layout.id, 'basePrice', parseInt(e.target.value))}
                                                />
                                            </div>
                                            <button
                                                onClick={() => toggleKitchenItem('layouts', layout.id)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                                    layout.enabled ? "bg-[#0F172A]" : "bg-gray-200"
                                                )}
                                            >
                                                <span className={cn(
                                                    "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                                    layout.enabled ? "translate-x-5" : "translate-x-0"
                                                )} />
                                            </button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                                onClick={() => deleteKitchenItem('layouts', layout.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Kitchen Add-ons */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Kitchen Add-ons</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-gray-400 hover:text-[#0F172A]"
                                    onClick={() => setShowAddKitchenAddon(true)}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {localConfig.kitchen.addOns.map((addon) => (
                                    <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-[#0F172A] transition-all group">
                                        {editingKitchenItem === addon.id ? (
                                            <Input
                                                autoFocus
                                                className="text-sm font-bold text-gray-700 w-32"
                                                defaultValue={addon.name}
                                                onBlur={(e) => updateKitchenItemName('addOns', addon.id, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') updateKitchenItemName('addOns', addon.id, e.currentTarget.value);
                                                    else if (e.key === 'Escape') setEditingKitchenItem(null);
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-700">{addon.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"
                                                    onClick={() => setEditingKitchenItem(addon.id)}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-2">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                                                <Input
                                                    type="number"
                                                    className="pl-6 h-8 w-28 bg-gray-50/50 border-none font-bold text-[#0F172A] text-right"
                                                    value={addon.price}
                                                    onChange={(e) => updateKitchenAddOn(addon.id, 'price', parseInt(e.target.value))}
                                                />
                                            </div>
                                            <button
                                                onClick={() => toggleKitchenItem('addOns', addon.id)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                                    addon.enabled ? "bg-[#0F172A]" : "bg-gray-200"
                                                )}
                                            >
                                                <span className={cn(
                                                    "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                                    addon.enabled ? "translate-x-5" : "translate-x-0"
                                                )} />
                                            </button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                                onClick={() => deleteKitchenItem('addOns', addon.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Section 3: Bedroom Configuration */}
            {localConfig.bedrooms && (
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between p-6 border-b">
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 bg-[#0F172A] rounded flex items-center justify-center text-white font-bold text-xs">
                                3
                            </div>
                            <CardTitle className="text-lg font-bold text-[#0F172A]">Bedroom Configuration</CardTitle>
                        </div>
                        <Bed className="h-5 w-5 text-gray-400" />
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        {/* Bedroom Counts */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Bedroom Count Pricing</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-gray-400 hover:text-[#0F172A]"
                                    onClick={() => setShowAddBedroomCount(true)}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {localConfig.bedrooms.counts.map((bc) => (
                                    <div key={bc.count} className="flex items-center justify-between p-3 border rounded-lg hover:border-[#0F172A] transition-all group">
                                        <span className="text-sm font-bold text-gray-700">{bc.count} Bedroom{bc.count > 1 ? 's' : ''}</span>
                                        <div className="flex items-center space-x-2">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                                                <Input
                                                    type="number"
                                                    className="pl-6 h-8 w-28 bg-gray-50/50 border-none font-bold text-[#0F172A] text-right"
                                                    value={bc.basePrice}
                                                    onChange={(e) => updateBedroomCount(bc.count, parseInt(e.target.value))}
                                                />
                                            </div>
                                            <button
                                                onClick={() => toggleBedroomCount(bc.count)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                                    bc.enabled ? "bg-[#0F172A]" : "bg-gray-200"
                                                )}
                                            >
                                                <span className={cn(
                                                    "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                                    bc.enabled ? "translate-x-5" : "translate-x-0"
                                                )} />
                                            </button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                                onClick={() => deleteBedroomCount(bc.count)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bedroom Options */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Additional Options</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-gray-400 hover:text-[#0F172A]"
                                    onClick={() => setShowAddBedroomOption(true)}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {/* Legacy: Master Bedroom */}
                                <div className="flex items-center justify-between p-3 border rounded-lg hover:border-[#0F172A] transition-all group">
                                    {editingBedroomOption === 'masterBedroom' ? (
                                        <Input
                                            autoFocus
                                            className="text-sm font-bold text-gray-700 w-48"
                                            defaultValue="Master Bedroom (Additional)"
                                            onBlur={(e) => setEditingBedroomOption(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === 'Escape') setEditingBedroomOption(null);
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-700">Master Bedroom (Additional)</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"
                                                onClick={() => setEditingBedroomOption('masterBedroom')}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-2">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                                            <Input
                                                type="number"
                                                className="pl-6 h-8 w-28 bg-gray-50/50 border-none font-bold text-[#0F172A] text-right"
                                                value={localConfig.bedrooms.masterBedroom.additionalPrice}
                                                onChange={(e) => updateBedroomOption('masterBedroom', 'additionalPrice', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => toggleBedroomOption('masterBedroom')}
                                            className={cn(
                                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                                localConfig.bedrooms.masterBedroom.enabled ? "bg-[#0F172A]" : "bg-gray-200"
                                            )}
                                        >
                                            <span className={cn(
                                                "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                                localConfig.bedrooms.masterBedroom.enabled ? "translate-x-5" : "translate-x-0"
                                            )} />
                                        </button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                            onClick={() => {
                                                const newBedrooms = { ...localConfig.bedrooms };
                                                delete newBedrooms.masterBedroom;
                                                setLocalConfig({ ...localConfig, bedrooms: newBedrooms });
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Legacy: Wardrobe */}
                                <div className="flex items-center justify-between p-3 border rounded-lg hover:border-[#0F172A] transition-all group">
                                    {editingBedroomOption === 'wardrobe' ? (
                                        <Input
                                            autoFocus
                                            className="text-sm font-bold text-gray-700 w-48"
                                            defaultValue="Wardrobe (Per Bedroom)"
                                            onBlur={(e) => setEditingBedroomOption(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === 'Escape') setEditingBedroomOption(null);
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-700">Wardrobe (Per Bedroom)</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"
                                                onClick={() => setEditingBedroomOption('wardrobe')}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-2">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                                            <Input
                                                type="number"
                                                className="pl-6 h-8 w-28 bg-gray-50/50 border-none font-bold text-[#0F172A] text-right"
                                                value={localConfig.bedrooms.wardrobe.pricePerBedroom}
                                                onChange={(e) => updateBedroomOption('wardrobe', 'pricePerBedroom', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => toggleBedroomOption('wardrobe')}
                                            className={cn(
                                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                                localConfig.bedrooms.wardrobe.enabled ? "bg-[#0F172A]" : "bg-gray-200"
                                            )}
                                        >
                                            <span className={cn(
                                                "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                                localConfig.bedrooms.wardrobe.enabled ? "translate-x-5" : "translate-x-0"
                                            )} />
                                        </button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                            onClick={() => {
                                                const newBedrooms = { ...localConfig.bedrooms };
                                                delete newBedrooms.wardrobe;
                                                setLocalConfig({ ...localConfig, bedrooms: newBedrooms });
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Legacy: Study Unit */}
                                <div className="flex items-center justify-between p-3 border rounded-lg hover:border-[#0F172A] transition-all group">
                                    {editingBedroomOption === 'studyUnit' ? (
                                        <Input
                                            autoFocus
                                            className="text-sm font-bold text-gray-700 w-48"
                                            defaultValue="Study Unit (Per Unit)"
                                            onBlur={(e) => setEditingBedroomOption(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === 'Escape') setEditingBedroomOption(null);
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-700">Study Unit (Per Unit)</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"
                                                onClick={() => setEditingBedroomOption('studyUnit')}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-2">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                                            <Input
                                                type="number"
                                                className="pl-6 h-8 w-28 bg-gray-50/50 border-none font-bold text-[#0F172A] text-right"
                                                value={localConfig.bedrooms.studyUnit.pricePerUnit}
                                                onChange={(e) => updateBedroomOption('studyUnit', 'pricePerUnit', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => toggleBedroomOption('studyUnit')}
                                            className={cn(
                                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                                localConfig.bedrooms.studyUnit.enabled ? "bg-[#0F172A]" : "bg-gray-200"
                                            )}
                                        >
                                            <span className={cn(
                                                "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                                localConfig.bedrooms.studyUnit.enabled ? "translate-x-5" : "translate-x-0"
                                            )} />
                                        </button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                            onClick={() => {
                                                const newBedrooms = { ...localConfig.bedrooms };
                                                delete newBedrooms.studyUnit;
                                                setLocalConfig({ ...localConfig, bedrooms: newBedrooms });
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Dynamic Additional Options */}
                                {getBedroomAdditionalOptions().map((option) => (
                                    <div key={option.key} className="flex items-center justify-between p-3 border rounded-lg hover:border-[#0F172A] transition-all group">
                                        {editingBedroomOption === option.key ? (
                                            <Input
                                                autoFocus
                                                className="text-sm font-bold text-gray-700 w-48"
                                                defaultValue={option.key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                onBlur={(e) => updateBedroomOptionName(option.key, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') updateBedroomOptionName(option.key, e.currentTarget.value);
                                                    else if (e.key === 'Escape') setEditingBedroomOption(null);
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-700 capitalize">{option.key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"
                                                    onClick={() => setEditingBedroomOption(option.key)}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-2">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                                                <Input
                                                    type="number"
                                                    className="pl-6 h-8 w-28 bg-gray-50/50 border-none font-bold text-[#0F172A] text-right"
                                                    value={option.price}
                                                    onChange={(e) => updateBedroomOptionPrice(option.key, parseInt(e.target.value))}
                                                />
                                            </div>
                                            <button
                                                onClick={() => toggleBedroomOptionEnabled(option.key)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                                    option.enabled ? "bg-[#0F172A]" : "bg-gray-200"
                                                )}
                                            >
                                                <span className={cn(
                                                    "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                                    option.enabled ? "translate-x-5" : "translate-x-0"
                                                )} />
                                            </button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                                onClick={() => deleteBedroomOption(option.key)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Section 4: Material Grades */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between p-6 border-b">
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 bg-[#0F172A] rounded flex items-center justify-center text-white font-bold text-xs">
                                4
                            </div>
                            <CardTitle className="text-lg font-bold text-[#0F172A]">Material Grades</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-300"
                            onClick={() => setShowAddMaterial(true)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                            {localConfig.materialGrades.map((grade) => (
                                <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-[#0F172A] transition-all">
                                    <span className="text-sm font-bold text-gray-700">{grade.name}</span>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="number"
                                            step="0.1"
                                            className="h-8 w-20 bg-gray-50/50 border-none font-bold text-[#0F172A] text-right"
                                            value={grade.multiplier}
                                            onChange={(e) => updateMultiplier('material', grade.id, parseFloat(e.target.value))}
                                        />
                                        <span className="text-gray-400 text-xs font-bold">x</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                                            onClick={() => deleteMaterial(grade.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Section 5: Finish Types */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between p-6 border-b">
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 bg-[#0F172A] rounded flex items-center justify-center text-white font-bold text-xs">
                                5
                            </div>
                            <CardTitle className="text-lg font-bold text-[#0F172A]">Finish Types</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-300"
                            onClick={() => setShowAddFinish(true)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                            {localConfig.finishTypes.map((finish) => (
                                <div key={finish.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-[#0F172A] transition-all">
                                    <span className="text-sm font-bold text-gray-700">{finish.name}</span>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="number"
                                            step="0.1"
                                            className="h-8 w-20 bg-gray-50/50 border-none font-bold text-[#0F172A] text-right"
                                            value={finish.multiplier}
                                            onChange={(e) => updateMultiplier('finish', finish.id, parseFloat(e.target.value))}
                                        />
                                        <span className="text-gray-400 text-xs font-bold">x</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                                            onClick={() => deleteFinish(finish.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-64 right-0 bg-white border-t p-4 px-8 flex items-center justify-between z-10 shadow-lg">
                <div className="flex items-center px-4 py-2 bg-blue-50/50 rounded-full border border-blue-100 border-dashed">
                    <Info className="h-4 w-4 text-blue-400 mr-3" />
                    <p className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">
                        These rules directly control the public estimate calculator on your website.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 py-6 rounded-md font-bold"
                >
                    <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving Pricing Changes..." : "Save Pricing Rules"}
                </Button>
            </div>

            {/* Add Material Dialog */}
            <Dialog open={showAddMaterial} onOpenChange={setShowAddMaterial}>
                <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-5 bg-[#0F172A] text-white">
                        <DialogTitle className="text-lg font-bold">Add New Material Grade</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">Add a new material grade with a price multiplier.</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="materialName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Material Name</Label>
                            <Input
                                id="materialName"
                                placeholder="e.g., Plywood"
                                value={newMaterialName}
                                onChange={(e) => setNewMaterialName(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="materialMultiplier" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Multiplier</Label>
                            <Input
                                id="materialMultiplier"
                                type="number"
                                step="0.1"
                                placeholder="e.g., 1.3"
                                value={newMaterialMultiplier}
                                onChange={(e) => setNewMaterialMultiplier(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
                        <Button variant="outline" onClick={() => setShowAddMaterial(false)} className="h-11 px-6">Cancel</Button>
                        <Button onClick={addNewMaterial} disabled={!newMaterialName || !newMaterialMultiplier} className="h-11 px-6 bg-[#0F172A] hover:bg-[#1E293B]">
                            Add Material
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Finish Dialog */}
            <Dialog open={showAddFinish} onOpenChange={setShowAddFinish}>
                <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-5 bg-[#0F172A] text-white">
                        <DialogTitle className="text-lg font-bold">Add New Finish Type</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">Add a new finish type with a price multiplier.</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="finishName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Finish Name</Label>
                            <Input
                                id="finishName"
                                placeholder="e.g., Veneer"
                                value={newFinishName}
                                onChange={(e) => setNewFinishName(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="finishMultiplier" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Multiplier</Label>
                            <Input
                                id="finishMultiplier"
                                type="number"
                                step="0.1"
                                placeholder="e.g., 2.5"
                                value={newFinishMultiplier}
                                onChange={(e) => setNewFinishMultiplier(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
                        <Button variant="outline" onClick={() => setShowAddFinish(false)} className="h-11 px-6">Cancel</Button>
                        <Button onClick={addNewFinish} disabled={!newFinishName || !newFinishMultiplier} className="h-11 px-6 bg-[#0F172A] hover:bg-[#1E293B]">
                            Add Finish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Living Area Dialog */}
            <Dialog open={showAddLivingArea} onOpenChange={setShowAddLivingArea}>
                <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-5 bg-[#0F172A] text-white">
                        <DialogTitle className="text-lg font-bold">Add Living Area Option</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">Add a new living area option with pricing.</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="livingAreaName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Option Name</Label>
                            <Input
                                id="livingAreaName"
                                placeholder="e.g., Bookshelf"
                                value={newLivingAreaName}
                                onChange={(e) => setNewLivingAreaName(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="livingAreaPrice" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price (₹)</Label>
                            <Input
                                id="livingAreaPrice"
                                type="number"
                                placeholder="e.g., 25000"
                                value={newLivingAreaPrice}
                                onChange={(e) => setNewLivingAreaPrice(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
                        <Button variant="outline" onClick={() => setShowAddLivingArea(false)} className="h-11 px-6">Cancel</Button>
                        <Button onClick={addLivingAreaOption} disabled={!newLivingAreaName || !newLivingAreaPrice} className="h-11 px-6 bg-[#0F172A] hover:bg-[#1E293B]">
                            Add Option
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Wood Type Dialog */}
            <Dialog open={showAddWoodType} onOpenChange={setShowAddWoodType}>
                <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-5 bg-[#0F172A] text-white">
                        <DialogTitle className="text-lg font-bold">Add Wood Type</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">Add a new wood type with price multiplier.</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="woodTypeName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Wood Type Name</Label>
                            <Input
                                id="woodTypeName"
                                placeholder="e.g., Teak Wood"
                                value={newWoodTypeName}
                                onChange={(e) => setNewWoodTypeName(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="woodTypeMultiplier" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Multiplier</Label>
                            <Input
                                id="woodTypeMultiplier"
                                type="number"
                                step="0.1"
                                placeholder="e.g., 1.8"
                                value={newWoodTypeMultiplier}
                                onChange={(e) => setNewWoodTypeMultiplier(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
                        <Button variant="outline" onClick={() => setShowAddWoodType(false)} className="h-11 px-6">Cancel</Button>
                        <Button onClick={addKitchenWoodType} disabled={!newWoodTypeName || !newWoodTypeMultiplier} className="h-11 px-6 bg-[#0F172A] hover:bg-[#1E293B]">
                            Add Wood Type
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Kitchen Layout Dialog */}
            <Dialog open={showAddKitchenLayout} onOpenChange={setShowAddKitchenLayout}>
                <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-5 bg-[#0F172A] text-white">
                        <DialogTitle className="text-lg font-bold">Add Kitchen Layout</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">Add a new kitchen layout with base price.</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="kitchenLayoutName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Layout Name</Label>
                            <Input
                                id="kitchenLayoutName"
                                placeholder="e.g., G-Shape"
                                value={newKitchenLayoutName}
                                onChange={(e) => setNewKitchenLayoutName(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kitchenLayoutPrice" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Base Price (₹)</Label>
                            <Input
                                id="kitchenLayoutPrice"
                                type="number"
                                placeholder="e.g., 280000"
                                value={newKitchenLayoutPrice}
                                onChange={(e) => setNewKitchenLayoutPrice(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
                        <Button variant="outline" onClick={() => setShowAddKitchenLayout(false)} className="h-11 px-6">Cancel</Button>
                        <Button onClick={addKitchenLayout} disabled={!newKitchenLayoutName || !newKitchenLayoutPrice} className="h-11 px-6 bg-[#0F172A] hover:bg-[#1E293B]">
                            Add Layout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Kitchen Add-on Dialog */}
            <Dialog open={showAddKitchenAddon} onOpenChange={setShowAddKitchenAddon}>
                <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-5 bg-[#0F172A] text-white">
                        <DialogTitle className="text-lg font-bold">Add Kitchen Add-on</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">Add a new kitchen add-on with pricing.</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="kitchenAddonName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add-on Name</Label>
                            <Input
                                id="kitchenAddonName"
                                placeholder="e.g., Chimney"
                                value={newKitchenAddonName}
                                onChange={(e) => setNewKitchenAddonName(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kitchenAddonPrice" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price (₹)</Label>
                            <Input
                                id="kitchenAddonPrice"
                                type="number"
                                placeholder="e.g., 18000"
                                value={newKitchenAddonPrice}
                                onChange={(e) => setNewKitchenAddonPrice(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
                        <Button variant="outline" onClick={() => setShowAddKitchenAddon(false)} className="h-11 px-6">Cancel</Button>
                        <Button onClick={addKitchenAddOn} disabled={!newKitchenAddonName || !newKitchenAddonPrice} className="h-11 px-6 bg-[#0F172A] hover:bg-[#1E293B]">
                            Add Add-on
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Bedroom Count Dialog */}
            <Dialog open={showAddBedroomCount} onOpenChange={setShowAddBedroomCount}>
                <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-5 bg-[#0F172A] text-white">
                        <DialogTitle className="text-lg font-bold">Add Bedroom Count</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">Add pricing for a new bedroom count.</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="bedroomCount" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Number of Bedrooms</Label>
                            <Input
                                id="bedroomCount"
                                type="number"
                                min="1"
                                placeholder="e.g., 4"
                                value={newBedroomCount}
                                onChange={(e) => setNewBedroomCount(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bedroomPrice" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Base Price (₹)</Label>
                            <Input
                                id="bedroomPrice"
                                type="number"
                                placeholder="e.g., 400000"
                                value={newBedroomPrice}
                                onChange={(e) => setNewBedroomPrice(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
                        <Button variant="outline" onClick={() => setShowAddBedroomCount(false)} className="h-11 px-6">Cancel</Button>
                        <Button onClick={addBedroomCount} disabled={!newBedroomCount || !newBedroomPrice} className="h-11 px-6 bg-[#0F172A] hover:bg-[#1E293B]">
                            Add Bedroom
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Bedroom Additional Option Dialog */}
            <Dialog open={showAddBedroomOption} onOpenChange={setShowAddBedroomOption}>
                <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-5 bg-[#0F172A] text-white">
                        <DialogTitle className="text-lg font-bold">Add Additional Option</DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">Add a new bedroom additional option with pricing.</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="bedroomOptionName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Option Name</Label>
                            <Input
                                id="bedroomOptionName"
                                placeholder="e.g., Dressing Unit"
                                value={newBedroomOptionName}
                                onChange={(e) => setNewBedroomOptionName(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bedroomOptionPrice" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price (₹)</Label>
                            <Input
                                id="bedroomOptionPrice"
                                type="number"
                                placeholder="e.g., 32000"
                                value={newBedroomOptionPrice}
                                onChange={(e) => setNewBedroomOptionPrice(e.target.value)}
                                className="h-12 border-gray-200 focus:border-[#0F172A] focus:ring-[#0F172A]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
                        <Button variant="outline" onClick={() => setShowAddBedroomOption(false)} className="h-11 px-6">Cancel</Button>
                        <Button onClick={addBedroomOption} disabled={!newBedroomOptionName || !newBedroomOptionPrice} className="h-11 px-6 bg-[#0F172A] hover:bg-[#1E293B]">
                            Add Option
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
