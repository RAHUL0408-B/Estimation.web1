"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Save,
    Trash2,
    Pencil,
    GripVertical,
    ChevronUp,
    ChevronDown
} from "lucide-react";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import {
    usePricingConfig,
    PricingConfig,
    Category,
    PricingItem,
    DropdownOption
} from "@/hooks/usePricingConfig";
import { CityManagement } from "@/components/dashboard/CityManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function PricingPage() {
    const { tenant } = useTenantAuth();
    const { config, loading, saveConfig } = usePricingConfig(tenant?.id || null);
    const [localConfig, setLocalConfig] = useState<PricingConfig | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Dialog states
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [showAddKitchenLayout, setShowAddKitchenLayout] = useState(false);
    const [showAddKitchenMaterial, setShowAddKitchenMaterial] = useState(false);

    // Form states
    const [newCategoryName, setNewCategoryName] = useState("");
    const [selectedCategoryForItem, setSelectedCategoryForItem] = useState("");
    const [newItemName, setNewItemName] = useState("");
    const [newItemType, setNewItemType] = useState<'fixed' | 'perUnit' | 'perSqft'>('fixed');
    const [newItemBasicPrice, setNewItemBasicPrice] = useState("");
    const [newItemStandardPrice, setNewItemStandardPrice] = useState("");
    const [newItemLuxePrice, setNewItemLuxePrice] = useState("");
    const [newKitchenLayoutName, setNewKitchenLayoutName] = useState("");
    const [newKitchenMaterialName, setNewKitchenMaterialName] = useState("");

    // Edit states
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);
    const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);

    useEffect(() => {
        if (config) {
            setLocalConfig(JSON.parse(JSON.stringify(config)));
        }
    }, [config]);

    const handleSave = async () => {
        if (!localConfig) return;
        setIsSaving(true);
        const success = await saveConfig(localConfig);
        if (success) {
            alert("✅ Pricing configuration saved successfully!");
        } else {
            alert("❌ Failed to save pricing configuration");
        }
        setIsSaving(false);
    };

    // Category Management
    const addCategory = async () => {
        if (!localConfig || !newCategoryName) return;
        const newCategory: Category = {
            id: `cat_${Date.now()}`,
            name: newCategoryName,
            order: localConfig.categories?.length || 0,
            items: []
        };
        const updatedConfig = {
            ...localConfig,
            categories: [...(localConfig.categories || []), newCategory]
        };
        setLocalConfig(updatedConfig);
        await saveConfig(updatedConfig);
        setNewCategoryName("");
        setShowAddCategory(false);
    };

    const deleteCategory = async (categoryId: string) => {
        if (!localConfig) return;
        if (!confirm("Are you sure you want to delete this category and all its items?")) return;
        const updatedConfig = {
            ...localConfig,
            categories: localConfig.categories?.filter(c => c.id !== categoryId)
        };
        setLocalConfig(updatedConfig);
        await saveConfig(updatedConfig);
    };

    const updateCategoryName = (categoryId: string, newName: string) => {
        if (!localConfig) return;
        const updatedConfig = {
            ...localConfig,
            categories: localConfig.categories?.map(c =>
                c.id === categoryId ? { ...c, name: newName } : c
            )
        };
        setLocalConfig(updatedConfig);
        saveConfig(updatedConfig); // Auto-save
        setEditingCategoryId(null);
    };

    const moveCategoryUp = (categoryId: string) => {
        if (!localConfig?.categories) return;
        const index = localConfig.categories.findIndex(c => c.id === categoryId);
        if (index <= 0) return;

        const newCategories = [...localConfig.categories];
        [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
        newCategories.forEach((cat, idx) => cat.order = idx);

        const updatedConfig = { ...localConfig, categories: newCategories };
        setLocalConfig(updatedConfig);
        saveConfig(updatedConfig); // Auto-save
    };

    const moveCategoryDown = (categoryId: string) => {
        if (!localConfig?.categories) return;
        const index = localConfig.categories.findIndex(c => c.id === categoryId);
        if (index < 0 || index >= localConfig.categories.length - 1) return;

        const newCategories = [...localConfig.categories];
        [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
        newCategories.forEach((cat, idx) => cat.order = idx);

        const updatedConfig = { ...localConfig, categories: newCategories };
        setLocalConfig(updatedConfig);
        saveConfig(updatedConfig); // Auto-save
    };

    // Item Management
    const addItem = async () => {
        if (!localConfig || !selectedCategoryForItem) return;

        if (!newItemName.trim()) {
            alert("Please enter an item name");
            return;
        }
        if (!newItemBasicPrice || !newItemStandardPrice || !newItemLuxePrice) {
            alert("Please enter all prices");
            return;
        }

        const newItem: PricingItem = {
            id: `item_${Date.now()}`,
            name: newItemName,
            type: newItemType,
            basicPrice: parseInt(newItemBasicPrice),
            standardPrice: parseInt(newItemStandardPrice),
            luxePrice: parseInt(newItemLuxePrice),
            enabled: true
        };

        const updatedConfig = {
            ...localConfig,
            categories: localConfig.categories?.map(cat =>
                cat.id === selectedCategoryForItem
                    ? { ...cat, items: [...cat.items, newItem] }
                    : cat
            )
        };

        setLocalConfig(updatedConfig);
        await saveConfig(updatedConfig);

        setNewItemName("");
        setNewItemBasicPrice("");
        setNewItemStandardPrice("");
        setNewItemLuxePrice("");
        setShowAddItem(false);
    };

    const deleteItem = async (categoryId: string, itemId: string) => {
        if (!localConfig) return;
        const updatedConfig = {
            ...localConfig,
            categories: localConfig.categories?.map(cat =>
                cat.id === categoryId
                    ? { ...cat, items: cat.items.filter(i => i.id !== itemId) }
                    : cat
            )
        };
        setLocalConfig(updatedConfig);
        await saveConfig(updatedConfig);
    };

    const updateItem = async (categoryId: string, itemId: string, updates: Partial<PricingItem>) => {
        if (!localConfig) return;
        const updatedConfig = {
            ...localConfig,
            categories: localConfig.categories?.map(cat =>
                cat.id === categoryId
                    ? {
                        ...cat,
                        items: cat.items.map(item =>
                            item.id === itemId ? { ...item, ...updates } : item
                        )
                    }
                    : cat
            )
        };
        setLocalConfig(updatedConfig);
        await saveConfig(updatedConfig);
    };

    const toggleItem = async (categoryId: string, itemId: string) => {
        if (!localConfig) return;
        const updatedConfig = {
            ...localConfig,
            categories: localConfig.categories?.map(cat =>
                cat.id === categoryId
                    ? {
                        ...cat,
                        items: cat.items.map(item =>
                            item.id === itemId ? { ...item, enabled: !item.enabled } : item
                        )
                    }
                    : cat
            )
        };
        setLocalConfig(updatedConfig);
        await saveConfig(updatedConfig);
    };

    // Kitchen Dropdown Management
    const addKitchenLayout = async () => {
        if (!localConfig || !newKitchenLayoutName) return;
        const newLayout: DropdownOption = {
            id: `kl_${Date.now()}`,
            name: newKitchenLayoutName,
            enabled: true
        };
        setLocalConfig({
            ...localConfig,
            kitchenLayouts: [...(localConfig.kitchenLayouts || []), newLayout]
        });
        setNewKitchenLayoutName("");
        setShowAddKitchenLayout(false);
    };

    const deleteKitchenLayout = (layoutId: string) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            kitchenLayouts: localConfig.kitchenLayouts?.filter(l => l.id !== layoutId)
        });
    };

    const updateKitchenLayout = (layoutId: string, name: string) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            kitchenLayouts: localConfig.kitchenLayouts?.map(l =>
                l.id === layoutId ? { ...l, name } : l
            )
        });
        setEditingLayoutId(null);
    };

    const toggleKitchenLayout = (layoutId: string) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            kitchenLayouts: localConfig.kitchenLayouts?.map(l =>
                l.id === layoutId ? { ...l, enabled: !l.enabled } : l
            )
        });
    };

    const addKitchenMaterial = () => {
        if (!localConfig || !newKitchenMaterialName) return;
        const newMaterial: DropdownOption = {
            id: `km_${Date.now()}`,
            name: newKitchenMaterialName,
            enabled: true
        };
        setLocalConfig({
            ...localConfig,
            kitchenMaterials: [...(localConfig.kitchenMaterials || []), newMaterial]
        });
        setNewKitchenMaterialName("");
        setShowAddKitchenMaterial(false);
    };

    const deleteKitchenMaterial = (materialId: string) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            kitchenMaterials: localConfig.kitchenMaterials?.filter(m => m.id !== materialId)
        });
    };

    const updateKitchenMaterial = (materialId: string, name: string) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            kitchenMaterials: localConfig.kitchenMaterials?.map(m =>
                m.id === materialId ? { ...m, name } : m
            )
        });
        setEditingMaterialId(null);
    };

    const toggleKitchenMaterial = (materialId: string) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            kitchenMaterials: localConfig.kitchenMaterials?.map(m =>
                m.id === materialId ? { ...m, enabled: !m.enabled } : m
            )
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
                    <p className="text-gray-500 text-sm">Manage three-tier pricing (Basic / Standard / Luxe) for all items</p>
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
                        <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save All Changes"}
                    </Button>
                </div>
            </div>

            {/* City Management Section */}
            {tenant?.id && <CityManagement tenantId={tenant.id} />}

            {/* Categories Section */}
            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between p-6 border-b">
                    <CardTitle className="text-lg font-bold text-[#0F172A]">Categories & Items</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddCategory(true)}
                        className="text-blue-600 hover:text-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-1" /> Add Category
                    </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {localConfig.categories?.sort((a, b) => a.order - b.order).map((category, catIndex) => (
                        <div key={category.id} className="border rounded-lg p-4 space-y-4">
                            {/* Category Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 p-0"
                                            onClick={() => moveCategoryUp(category.id)}
                                            disabled={catIndex === 0}
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 p-0"
                                            onClick={() => moveCategoryDown(category.id)}
                                            disabled={catIndex === (localConfig.categories?.length || 0) - 1}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {editingCategoryId === category.id ? (
                                        <Input
                                            autoFocus
                                            className="font-bold text-lg w-64"
                                            defaultValue={category.name}
                                            onBlur={(e) => updateCategoryName(category.id, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') updateCategoryName(category.id, e.currentTarget.value);
                                                else if (e.key === 'Escape') setEditingCategoryId(null);
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-[#0F172A]">{category.name}</h3>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-gray-400 hover:text-blue-600"
                                                onClick={() => setEditingCategoryId(category.id)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedCategoryForItem(category.id);
                                            setShowAddItem(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Add Item
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteCategory(category.id)}
                                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Items Table */}
                            {category.items.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b bg-gray-50">
                                                <th className="text-left p-3 text-xs font-bold text-gray-600 uppercase w-[20%]">Item Name</th>
                                                <th className="text-center p-3 text-xs font-bold text-gray-600 uppercase w-[10%]">Type</th>
                                                <th className="text-right p-3 text-xs font-bold text-gray-600 uppercase w-[15%]">Basic (₹)</th>
                                                <th className="text-right p-3 text-xs font-bold text-gray-600 uppercase w-[15%]">Standard (₹)</th>
                                                <th className="text-right p-3 text-xs font-bold text-gray-600 uppercase w-[15%]">Luxe (₹)</th>
                                                <th className="text-center p-3 text-xs font-bold text-gray-600 uppercase w-[10%]">Enabled</th>
                                                <th className="text-center p-3 text-xs font-bold text-gray-600 uppercase w-[15%]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {category.items.map((item) => (
                                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                                    <td className="p-3">
                                                        {editingItemId === item.id ? (
                                                            <Input
                                                                autoFocus
                                                                className="text-sm"
                                                                defaultValue={item.name}
                                                                onBlur={(e) => {
                                                                    updateItem(category.id, item.id, { name: e.target.value });
                                                                    setEditingItemId(null);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        updateItem(category.id, item.id, { name: e.currentTarget.value });
                                                                        setEditingItemId(null);
                                                                    } else if (e.key === 'Escape') {
                                                                        setEditingItemId(null);
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium">{item.name}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"
                                                                    onClick={() => setEditingItemId(item.id)}
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Select
                                                            value={item.type}
                                                            onValueChange={(value: 'fixed' | 'perUnit' | 'perSqft') =>
                                                                updateItem(category.id, item.id, { type: value })
                                                            }
                                                        >
                                                            <SelectTrigger className="w-28 h-8 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="fixed">Fixed</SelectItem>
                                                                <SelectItem value="perUnit">Per Unit</SelectItem>
                                                                <SelectItem value="perSqft">Per Sqft</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Input
                                                            type="number"
                                                            className="text-right h-8 w-28"
                                                            value={item.basicPrice}
                                                            onChange={(e) =>
                                                                updateItem(category.id, item.id, { basicPrice: parseInt(e.target.value) || 0 })
                                                            }
                                                        />
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Input
                                                            type="number"
                                                            className="text-right h-8 w-28"
                                                            value={item.standardPrice}
                                                            onChange={(e) =>
                                                                updateItem(category.id, item.id, { standardPrice: parseInt(e.target.value) || 0 })
                                                            }
                                                        />
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Input
                                                            type="number"
                                                            className="text-right h-8 w-28"
                                                            value={item.luxePrice}
                                                            onChange={(e) =>
                                                                updateItem(category.id, item.id, { luxePrice: parseInt(e.target.value) || 0 })
                                                            }
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={() => toggleItem(category.id, item.id)}
                                                            className={cn(
                                                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                                                item.enabled ? "bg-[#0F172A]" : "bg-gray-200"
                                                            )}
                                                        >
                                                            <span className={cn(
                                                                "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                                                item.enabled ? "translate-x-5" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => deleteItem(category.id, item.id)}
                                                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-4">No items in this category. Click "Add Item" to get started.</p>
                            )}
                        </div>
                    ))}

                    {(!localConfig.categories || localConfig.categories.length === 0) && (
                        <p className="text-center text-gray-400 py-8">No categories yet. Click "Add Category" to get started.</p>
                    )}
                </CardContent>
            </Card>

            {/* Kitchen Dropdowns Section */}
            <div className="grid grid-cols-2 gap-6">
                {/* Kitchen Layouts */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between p-6 border-b">
                        <CardTitle className="text-lg font-bold text-[#0F172A]">Kitchen Layouts</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAddKitchenLayout(true)}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                        {localConfig.kitchenLayouts?.map((layout) => (
                            <div key={layout.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-[#0F172A] transition-all group">
                                {editingLayoutId === layout.id ? (
                                    <Input
                                        autoFocus
                                        className="text-sm font-medium"
                                        defaultValue={layout.name}
                                        onBlur={(e) => updateKitchenLayout(layout.id, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') updateKitchenLayout(layout.id, e.currentTarget.value);
                                            else if (e.key === 'Escape') setEditingLayoutId(null);
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{layout.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"
                                            onClick={() => setEditingLayoutId(layout.id)}
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleKitchenLayout(layout.id)}
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
                                        onClick={() => deleteKitchenLayout(layout.id)}
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Kitchen Materials */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between p-6 border-b">
                        <CardTitle className="text-lg font-bold text-[#0F172A]">Kitchen Materials</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAddKitchenMaterial(true)}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                        {localConfig.kitchenMaterials?.map((material) => (
                            <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-[#0F172A] transition-all group">
                                {editingMaterialId === material.id ? (
                                    <Input
                                        autoFocus
                                        className="text-sm font-medium"
                                        defaultValue={material.name}
                                        onBlur={(e) => updateKitchenMaterial(material.id, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') updateKitchenMaterial(material.id, e.currentTarget.value);
                                            else if (e.key === 'Escape') setEditingMaterialId(null);
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{material.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"
                                            onClick={() => setEditingMaterialId(material.id)}
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleKitchenMaterial(material.id)}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                            material.enabled ? "bg-[#0F172A]" : "bg-gray-200"
                                        )}
                                    >
                                        <span className={cn(
                                            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                            material.enabled ? "translate-x-5" : "translate-x-0"
                                        )} />
                                    </button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteKitchenMaterial(material.id)}
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Add Category Dialog */}
            <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>Create a new category to organize your pricing items.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Category Name</Label>
                            <Input
                                placeholder="e.g., Living Area, Bedroom, Bathroom"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowAddCategory(false)}>Cancel</Button>
                        <Button onClick={addCategory}>Add Category</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Item Dialog */}
            <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Item</DialogTitle>
                        <DialogDescription>Add a new pricing item to the selected category.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Item Name</Label>
                            <Input
                                placeholder="e.g., TV Unit, Wardrobe, Vanity"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Pricing Type</Label>
                            <Select value={newItemType} onValueChange={(value: 'fixed' | 'perUnit' | 'perSqft') => setNewItemType(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fixed">Fixed Price (one-time)</SelectItem>
                                    <SelectItem value="perUnit">Per Unit (quantity-based)</SelectItem>
                                    <SelectItem value="perSqft">Per Sqft (area-based)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Basic Price (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="28000"
                                    value={newItemBasicPrice}
                                    onChange={(e) => setNewItemBasicPrice(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Standard Price (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="35000"
                                    value={newItemStandardPrice}
                                    onChange={(e) => setNewItemStandardPrice(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Luxe Price (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="42000"
                                    value={newItemLuxePrice}
                                    onChange={(e) => setNewItemLuxePrice(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowAddItem(false)}>Cancel</Button>
                        <Button onClick={addItem}>Add Item</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Kitchen Layout Dialog */}
            <Dialog open={showAddKitchenLayout} onOpenChange={setShowAddKitchenLayout}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Kitchen Layout</DialogTitle>
                        <DialogDescription>Add a new kitchen layout option for the dropdown.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Layout Name</Label>
                            <Input
                                placeholder="e.g., L-Shape, U-Shape, Island"
                                value={newKitchenLayoutName}
                                onChange={(e) => setNewKitchenLayoutName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowAddKitchenLayout(false)}>Cancel</Button>
                        <Button onClick={addKitchenLayout}>Add Layout</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Kitchen Material Dialog */}
            <Dialog open={showAddKitchenMaterial} onOpenChange={setShowAddKitchenMaterial}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Kitchen Material</DialogTitle>
                        <DialogDescription>Add a new kitchen material option for the dropdown.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Material Name</Label>
                            <Input
                                placeholder="e.g., Marine Ply, HDHMR, MDF"
                                value={newKitchenMaterialName}
                                onChange={(e) => setNewKitchenMaterialName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowAddKitchenMaterial(false)}>Cancel</Button>
                        <Button onClick={addKitchenMaterial}>Add Material</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
