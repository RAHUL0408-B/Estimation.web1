"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Plus,
    Trash2,
    Edit,
    Layout,
    Layers,
    Home,
    PencilRuler,
    Save,
    X,
    Palette,
    Armchair,
    DoorOpen,
    Lightbulb,
} from "lucide-react";
import { useHomePage } from "@/hooks/useWebsiteBuilder";
import { useToast } from "@/hooks/use-toast";
import type { Service } from "@/types/website";

interface ServicesPageEditorProps {
    tenantId: string;
}

const AVAILABLE_ICONS = [
    { name: "Layout", icon: Layout },
    { name: "Layers", icon: Layers },
    { name: "Home", icon: Home },
    { name: "PencilRuler", icon: PencilRuler },
    { name: "Palette", icon: Palette },
    { name: "Armchair", icon: Armchair },
    { name: "DoorOpen", icon: DoorOpen },
    { name: "Lightbulb", icon: Lightbulb },
];

export default function ServicesPageEditor({ tenantId }: ServicesPageEditorProps) {
    const { homeContent, loading, saving, addService, updateService, deleteService } = useHomePage(tenantId);
    const { toast } = useToast();

    const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!homeContent) return null;

    const handleAddService = () => {
        setEditingService({
            title: "",
            description: "",
            iconUrl: "Layout", // Use icon name as iconUrl
        });
    };

    const handleSaveService = async () => {
        if (!editingService || !editingService.title) return;

        if (editingService.id) {
            const success = await updateService(editingService.id, editingService);
            if (success) {
                toast({ title: "Updated", description: "Service updated successfully." });
                setEditingService(null);
            }
        } else {
            const success = await addService(editingService as any);
            if (success) {
                toast({ title: "Added", description: "Service added successfully." });
                setEditingService(null);
            }
        }
    };

    const getIcon = (iconName: string) => {
        const found = AVAILABLE_ICONS.find(i => i.name === iconName);
        return found ? <found.icon className="h-8 w-8 text-blue-500" /> : <Layout className="h-8 w-8 text-blue-500" />;
    };

    return (
        <div className="space-y-6">
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Our Services</CardTitle>
                        <Button onClick={handleAddService} size="sm" className="bg-[#0F172A] hover:bg-[#1E293B] rounded-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Service
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(homeContent.services?.length || 0) === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Layout className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No services yet. Add your first service.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(homeContent.services || []).map((service) => (
                                <div key={service.id} className="border-2 border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-all group relative">
                                    <div className="mb-4 h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                        {getIcon(service.iconUrl)}
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-2">{service.title}</h4>
                                    <p className="text-sm text-gray-500 line-clamp-3">{service.description}</p>

                                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white shadow-sm" onClick={() => setEditingService(service)}>
                                            <Edit className="h-4 w-4 text-gray-600" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50 shadow-sm" onClick={() => deleteService(service.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Edit Service Dialog */}
                    {editingService && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-[32px] max-w-lg w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {editingService.id ? "Edit Service" : "Add New Service"}
                                    </h3>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingService(null)} className="rounded-full">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Service Title</Label>
                                        <Input
                                            value={editingService.title || ""}
                                            onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                                            placeholder="e.g. Luxury Interior Design"
                                            className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Service Icon</Label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {AVAILABLE_ICONS.map((item) => (
                                                <button
                                                    key={item.name}
                                                    onClick={() => setEditingService({ ...editingService, iconUrl: item.name })}
                                                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${editingService.iconUrl === item.name
                                                            ? "bg-blue-600 text-white shadow-lg scale-105"
                                                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                                        }`}
                                                >
                                                    <item.icon className="h-6 w-6" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Description</Label>
                                        <Textarea
                                            value={editingService.description || ""}
                                            onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                                            placeholder="What does this service include?"
                                            rows={4}
                                            className="rounded-xl border-gray-100 bg-gray-50 focus:bg-white resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            onClick={handleSaveService}
                                            className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                                            disabled={saving}
                                        >
                                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                            Save Service
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
