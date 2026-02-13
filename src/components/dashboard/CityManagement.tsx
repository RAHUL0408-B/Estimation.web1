"use client";

import { useState } from "react";
import { useCities, City } from "@/hooks/useCities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Edit2, MapPin, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface CityManagementProps {
    tenantId: string;
}

export function CityManagement({ tenantId }: CityManagementProps) {
    const { cities, loading, addCity, updateCity, deleteCity, toggleCity } = useCities(tenantId);
    const { toast } = useToast();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [newCityName, setNewCityName] = useState("");
    const [editingCity, setEditingCity] = useState<City | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddCity = async () => {
        if (!newCityName.trim()) return;

        setIsSubmitting(true);
        const success = await addCity(newCityName.trim());
        setIsSubmitting(false);

        if (success) {
            toast({ title: "Success", description: "City added successfully" });
            setNewCityName("");
            setIsAddDialogOpen(false);
        } else {
            toast({ title: "Error", description: "Failed to add city", variant: "destructive" });
        }
    };

    const handleUpdateCity = async () => {
        if (!editingCity || !newCityName.trim()) return;

        setIsSubmitting(true);
        const success = await updateCity(editingCity.id, { name: newCityName.trim() });
        setIsSubmitting(false);

        if (success) {
            toast({ title: "Success", description: "City updated successfully" });
            setNewCityName("");
            setEditingCity(null);
            setIsEditDialogOpen(false);
        } else {
            toast({ title: "Error", description: "Failed to update city", variant: "destructive" });
        }
    };

    const handleDeleteCity = async (id: string) => {
        if (!confirm("Are you sure you want to delete this city?")) return;

        const success = await deleteCity(id);
        if (success) {
            toast({ title: "Deleted", description: "City deleted successfully" });
        } else {
            toast({ title: "Error", description: "Failed to delete city", variant: "destructive" });
        }
    };

    const openEditDialog = (city: City) => {
        setEditingCity(city);
        setNewCityName(city.name);
        setIsEditDialogOpen(true);
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
    }

    return (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-indigo-600" />
                            City Management
                        </CardTitle>
                        <CardDescription>Manage locations where you offer services</CardDescription>
                    </div>
                    <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="bg-[#0F172A] hover:bg-[#1E293B]">
                        <Plus className="h-4 w-4 mr-2" /> Add City
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {cities.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No cities added yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6">Start by adding the cities where your services are available.</p>
                        <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
                            Add First City
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y">
                        {cities.map((city) => (
                            <div key={city.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${city.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{city.name}</div>
                                        <div className="text-xs text-gray-500">{city.enabled ? "Active" : "Inactive"}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 mr-4">
                                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Status</span>
                                        <Switch
                                            checked={city.enabled}
                                            onCheckedChange={(checked) => toggleCity(city.id, !checked)}
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(city)}>
                                        <Edit2 className="h-4 w-4 text-gray-500" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCity(city.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New City</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>City Name</Label>
                                <Input
                                    placeholder="e.g. Mumbai, Bangalore"
                                    value={newCityName}
                                    onChange={(e) => setNewCityName(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddCity} disabled={isSubmitting || !newCityName.trim()}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add City
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit City</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>City Name</Label>
                                <Input
                                    placeholder="e.g. Mumbai, Bangalore"
                                    value={newCityName}
                                    onChange={(e) => setNewCityName(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateCity} disabled={isSubmitting || !newCityName.trim()}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update City
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
