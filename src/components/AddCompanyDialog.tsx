"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { addDesigner, generateStoreId } from "@/lib/firestoreHelpers";

interface AddCompanyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddCompanyDialog({ open, onOpenChange }: AddCompanyDialogProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        businessName: "",
        storeId: "",
        plan: "free" as "free" | "basic" | "pro" | "enterprise",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleBusinessNameChange = (businessName: string) => {
        setFormData({
            ...formData,
            businessName,
            storeId: generateStoreId(businessName),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Validation
            if (!formData.name || !formData.email || !formData.businessName || !formData.storeId) {
                setError("Please fill in all required fields");
                setLoading(false);
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setError("Please enter a valid email address");
                setLoading(false);
                return;
            }

            await addDesigner(formData);

            // Reset form
            setFormData({
                name: "",
                email: "",
                phone: "",
                businessName: "",
                storeId: "",
                plan: "free",
            });

            onOpenChange(false);
        } catch (err) {
            console.error("Error adding company:", err);
            setError("Failed to add company. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Company</DialogTitle>
                    <DialogDescription>
                        Register a new company on the platform. They will need approval before going live.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Admin Name *</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Admin Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="businessName">Company Name *</Label>
                            <Input
                                id="businessName"
                                placeholder="ABC Interiors Pvt Ltd"
                                value={formData.businessName}
                                onChange={(e) => handleBusinessNameChange(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="storeId">Company URL Slug *</Label>
                            <Input
                                id="storeId"
                                placeholder="abc-interiors"
                                value={formData.storeId}
                                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Public URL: /{formData.storeId || "company-slug"}
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="plan">Subscription Plan</Label>
                            <select
                                id="plan"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.plan}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        plan: e.target.value as "free" | "basic" | "pro" | "enterprise",
                                    })
                                }
                            >
                                <option value="free">Free</option>
                                <option value="basic">Basic</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Adding..." : "Add Company"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
