"use client";

import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, ChevronRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { cn } from "@/lib/utils";

interface GenerateEstimateDialogProps {
    trigger?: React.ReactNode;
}

export function GenerateEstimateDialog({ trigger }: GenerateEstimateDialogProps) {
    const { tenant } = useTenantAuth();
    const { config, loading: configLoading } = usePricingConfig(tenant?.id || null);

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const activeRooms = useMemo(() => {
        return config?.roomPricing.filter(r => r.enabled) || [];
    }, [config]);

    const [formData, setFormData] = useState({
        clientName: "",
        phone: "",
        city: "",
        carpetArea: "",
        rooms: [] as string[],
        materialId: "",
        finishId: "",
        hardware: "Standard (Hettich)"
    });

    // Initialize defaults when config loads
    useMemo(() => {
        if (config && !formData.materialId) {
            setFormData(prev => ({
                ...prev,
                materialId: config.materialGrades[0]?.id || "",
                finishId: config.finishTypes[0]?.id || ""
            }));
        }
    }, [config, formData.materialId]);

    const toggleRoom = (roomId: string) => {
        setFormData(prev => ({
            ...prev,
            rooms: prev.rooms.includes(roomId)
                ? prev.rooms.filter(id => id !== roomId)
                : [...prev.rooms, roomId]
        }));
    };

    const handleGenerate = async () => {
        if (!tenant || !config) return;
        setLoading(true);
        try {
            // Real amount calculation
            const selectedRooms = config.roomPricing.filter(r => formData.rooms.includes(r.id));
            const baseLumpSum = selectedRooms.reduce((sum, r) => sum + r.rate, 0);

            const material = config.materialGrades.find(m => m.id === formData.materialId);
            const finish = config.finishTypes.find(f => f.id === formData.finishId);

            const materialMultiplier = material?.multiplier || 1;
            const finishMultiplier = finish?.multiplier || 1;

            // Assume carpet area acts as a base multiplier for the whole project (simplified)
            const areaFactor = (parseInt(formData.carpetArea) / 1000) || 1;

            const totalAmount = baseLumpSum * materialMultiplier * finishMultiplier * areaFactor;

            await addDoc(collection(db, "estimates"), {
                tenantId: tenant.id,
                customerName: formData.clientName,
                phoneNumber: formData.phone,
                city: formData.city,
                carpetArea: formData.carpetArea,
                roomIds: formData.rooms,
                rooms: selectedRooms.map(r => r.name),
                material: material?.name,
                finish: finish?.name,
                hardware: formData.hardware,
                amount: Math.round(totalAmount),
                status: "pending",
                createdAt: serverTimestamp(),
            });

            setIsOpen(false);
            // Reset form
            setFormData({
                clientName: "",
                phone: "",
                city: "",
                carpetArea: "",
                rooms: [],
                materialId: config.materialGrades[0]?.id || "",
                finishId: config.finishTypes[0]?.id || "",
                hardware: "Standard (Hettich)"
            });
        } catch (error) {
            console.error("Error generating estimate:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Add New Estimate</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-white flex flex-row items-center justify-between border-b">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-[#0F172A] rounded-lg flex items-center justify-center text-white">
                            <Calculator className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-[#0F172A]">Generate New Estimate</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="p-8 grid grid-cols-2 gap-8 bg-white">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Client Name</Label>
                            <Input
                                placeholder="e.g, Rahul Sharma"
                                className="bg-gray-50/50 border-gray-100"
                                value={formData.clientName}
                                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Phone</Label>
                            <Input
                                placeholder="+91 XXXX XXXX"
                                className="bg-gray-50/50 border-gray-100"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase">City</Label>
                            <Input
                                placeholder="Mumbai"
                                className="bg-gray-50/50 border-gray-100"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Carpet Area (SQFT)</Label>
                            <Input
                                placeholder="e.g, 1200"
                                className="bg-gray-50/50 border-gray-100"
                                value={formData.carpetArea}
                                onChange={e => setFormData({ ...formData, carpetArea: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Rooms</Label>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                {configLoading ? (
                                    <div className="col-span-2 text-xs text-gray-400">Loading rooms...</div>
                                ) : activeRooms.map(room => (
                                    <div
                                        key={room.id}
                                        onClick={() => toggleRoom(room.id)}
                                        className={cn(
                                            "px-4 py-2 rounded border text-[10px] font-bold uppercase cursor-pointer transition-all",
                                            formData.rooms.includes(room.id)
                                                ? "bg-[#0F172A] text-white border-[#0F172A]"
                                                : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                                        )}
                                    >
                                        {room.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Material & Finish</Label>
                            <div className="flex space-x-2">
                                <select
                                    className="flex-1 bg-gray-50 border-gray-100 rounded-md p-2 text-xs text-gray-600 font-bold"
                                    value={formData.materialId}
                                    onChange={e => setFormData({ ...formData, materialId: e.target.value })}
                                >
                                    {config?.materialGrades.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.multiplier}x)</option>
                                    ))}
                                </select>
                                <select
                                    className="flex-1 bg-gray-50 border-gray-100 rounded-md p-2 text-xs text-gray-600 font-bold"
                                    value={formData.finishId}
                                    onChange={e => setFormData({ ...formData, finishId: e.target.value })}
                                >
                                    {config?.finishTypes.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} ({f.multiplier}x)</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Hardware Tier</Label>
                            <select
                                className="w-full bg-gray-50 border-gray-100 rounded-md p-2 text-xs text-gray-600 font-bold"
                                value={formData.hardware}
                                onChange={e => setFormData({ ...formData, hardware: e.target.value })}
                            >
                                <option>Standard (Hettich)</option>
                                <option>Premium (Hafele)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 flex items-center justify-between border-t">
                    <p className="text-[10px] text-gray-400 max-w-[200px] leading-relaxed">
                        Pricing rules from your configuration will be applied automatically to this estimate.
                    </p>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || configLoading}
                        className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 py-6 rounded-md font-bold"
                    >
                        {loading ? "Generating..." : "Generate Estimate"} <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
